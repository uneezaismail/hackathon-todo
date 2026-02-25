#!/bin/bash

# T089: Kafka Topics Creation Script
#
# Creates all required Kafka topics for the Phase V event-driven architecture:
# - task-events: Primary task event stream
# - reminders: Scheduled reminder events
# - task-updates: Real-time task updates for WebSocket
# - dlq-*: Dead letter queues for failed event processing
#
# Usage: ./scripts/create-kafka-topics.sh
#
# Environment variables:
# - KAFKA_BROKERS: Kafka broker list (default: localhost:9092)
# - KAFKA_ADMIN_CLIENT: Admin client jar path (optional)
# - TOPIC_PARTITIONS: Number of partitions (default: 12)
# - TOPIC_REPLICAS: Replication factor (default: 1)
# - RETENTION_HOURS: Log retention hours (default: 168 = 7 days)

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration with defaults
KAFKA_BROKERS="${KAFKA_BROKERS:-localhost:9092}"
TOPIC_PARTITIONS="${TOPIC_PARTITIONS:-12}"
TOPIC_REPLICAS="${TOPIC_REPLICAS:-1}"
RETENTION_HOURS="${RETENTION_HOURS:-168}"
RETENTION_MS=$((RETENTION_HOURS * 3600 * 1000))

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if we can connect to Kafka
    if ! check_kafka_connectivity; then
        log_error "Cannot connect to Kafka brokers at: $KAFKA_BROKERS"
        echo ""
        echo "Ensure Kafka is running:"
        echo "  Local Minikube: kubectl port-forward -n kafka svc/redpanda 9092:9092"
        echo "  Docker Compose: docker-compose up -d kafka"
        echo "  Manual: Start Kafka at $KAFKA_BROKERS"
        exit 1
    fi

    log_success "Kafka broker connectivity verified"
}

# Check Kafka connectivity
check_kafka_connectivity() {
    if command -v rpk &> /dev/null; then
        rpk broker list --brokers="$KAFKA_BROKERS" &> /dev/null && return 0
    fi

    if command -v kafka-broker-api-versions.sh &> /dev/null; then
        kafka-broker-api-versions.sh --bootstrap-server="$KAFKA_BROKERS" &> /dev/null && return 0
    fi

    # Fallback: try python client
    python3 -c "
from kafka.admin import KafkaAdminClient
try:
    admin = KafkaAdminClient(bootstrap_servers='$KAFKA_BROKERS', request_timeout_ms=5000)
    admin.close()
except:
    exit(1)
" 2>/dev/null && return 0

    return 1
}

# Create a single topic
create_topic() {
    local topic_name=$1
    local partitions=$2
    local replicas=$3
    local retention_ms=$4

    log_info "Creating topic: $topic_name"
    log_info "  - Partitions: $partitions"
    log_info "  - Replication factor: $replicas"
    log_info "  - Retention: ${RETENTION_HOURS} hours (${retention_ms}ms)"

    # Try using rpk (Redpanda CLI) first
    if command -v rpk &> /dev/null; then
        rpk topic create "$topic_name" \
            --brokers="$KAFKA_BROKERS" \
            --partitions="$partitions" \
            --replication-factor="$replicas" \
            --config retention.ms="$retention_ms" \
            --skip-if-exists &> /dev/null && {
            log_success "Topic '$topic_name' created"
            return 0
        }
    fi

    # Try using kafka-topics.sh
    if command -v kafka-topics.sh &> /dev/null; then
        kafka-topics.sh \
            --create \
            --bootstrap-server "$KAFKA_BROKERS" \
            --topic "$topic_name" \
            --partitions "$partitions" \
            --replication-factor "$replicas" \
            --config retention.ms="$retention_ms" \
            --if-not-exists &> /dev/null && {
            log_success "Topic '$topic_name' created"
            return 0
        }
    fi

    # Try using Python kafka-admin client
    if create_topic_python "$topic_name" "$partitions" "$replicas" "$retention_ms"; then
        log_success "Topic '$topic_name' created"
        return 0
    fi

    log_warning "Could not create topic '$topic_name' (may already exist)"
    return 0
}

# Create topic using Python client
create_topic_python() {
    local topic_name=$1
    local partitions=$2
    local replicas=$3
    local retention_ms=$4

    python3 << EOF
from kafka.admin import KafkaAdminClient, NewTopic
from kafka.errors import TopicAlreadyExistsError

try:
    admin_client = KafkaAdminClient(
        bootstrap_servers='$KAFKA_BROKERS',
        request_timeout_ms=5000
    )

    topic = NewTopic(
        name='$topic_name',
        num_partitions=$partitions,
        replication_factor=$replicas,
        topic_configs={'retention.ms': str($retention_ms)}
    )

    fs = admin_client.create_topics([topic], validate_only=False)

    for topic, f in fs.items():
        try:
            f.result()
        except TopicAlreadyExistsError:
            pass

    admin_client.close()
    exit(0)
except Exception as e:
    print(f"Error: {e}", file=__import__('sys').stderr)
    exit(1)
EOF
}

# List existing topics
list_topics() {
    log_info "Existing topics in Kafka:"

    if command -v rpk &> /dev/null; then
        rpk topic list --brokers="$KAFKA_BROKERS" || true
    elif command -v kafka-topics.sh &> /dev/null; then
        kafka-topics.sh --list --bootstrap-server "$KAFKA_BROKERS" || true
    else
        python3 << EOF
from kafka.admin import KafkaAdminClient

try:
    admin = KafkaAdminClient(bootstrap_servers='$KAFKA_BROKERS')
    topics = admin.list_topics()
    admin.close()
    for topic in sorted(topics.keys()):
        print(f"  - {topic}")
except Exception as e:
    print(f"Could not list topics: {e}", file=__import__('sys').stderr)
EOF
    fi
}

# Describe a topic
describe_topic() {
    local topic_name=$1

    log_info "Topic configuration for '$topic_name':"

    if command -v rpk &> /dev/null; then
        rpk topic describe "$topic_name" --brokers="$KAFKA_BROKERS" || true
    elif command -v kafka-topics.sh &> /dev/null; then
        kafka-topics.sh --describe --bootstrap-server "$KAFKA_BROKERS" --topic "$topic_name" || true
    fi
}

# Describe all created topics
describe_all_topics() {
    local topics=(
        "task-events"
        "reminders"
        "task-updates"
        "dlq-task-events"
        "dlq-reminders"
        "dlq-task-updates"
    )

    echo ""
    log_info "Topic configurations:"

    for topic in "${topics[@]}"; do
        describe_topic "$topic"
        echo ""
    done
}

# Verify topics were created
verify_topics_created() {
    log_info "Verifying topics were created..."

    local required_topics=(
        "task-events"
        "reminders"
        "task-updates"
        "dlq-task-events"
        "dlq-reminders"
        "dlq-task-updates"
    )

    local missing_topics=()

    for topic in "${required_topics[@]}"; do
        if topic_exists "$topic"; then
            log_success "Topic '$topic' exists"
        else
            missing_topics+=("$topic")
            log_warning "Topic '$topic' not found"
        fi
    done

    if [ ${#missing_topics[@]} -gt 0 ]; then
        log_error "Some topics are missing: ${missing_topics[*]}"
        return 1
    fi

    log_success "All required topics verified"
    return 0
}

# Check if topic exists
topic_exists() {
    local topic_name=$1

    if command -v rpk &> /dev/null; then
        rpk topic list --brokers="$KAFKA_BROKERS" 2>/dev/null | grep -q "^$topic_name$" && return 0
    elif command -v kafka-topics.sh &> /dev/null; then
        kafka-topics.sh --list --bootstrap-server "$KAFKA_BROKERS" 2>/dev/null | grep -q "^$topic_name$" && return 0
    else
        python3 << EOF 2>/dev/null
from kafka.admin import KafkaAdminClient
admin = KafkaAdminClient(bootstrap_servers='$KAFKA_BROKERS')
topics = admin.list_topics()
admin.close()
exit(0 if '$topic_name' in topics else 1)
EOF
        return $?
    fi

    return 1
}

# Display configuration summary
display_summary() {
    echo ""
    echo "========================================="
    echo "Kafka Topics Configuration Summary"
    echo "========================================="
    echo "Kafka Brokers:     $KAFKA_BROKERS"
    echo "Partitions:        $TOPIC_PARTITIONS"
    echo "Replication:       $TOPIC_REPLICAS"
    echo "Retention:         ${RETENTION_HOURS} hours"
    echo "=========================================​"
    echo ""
}

# Main execution
main() {
    log_info "Starting Kafka topics creation..."
    echo ""

    display_summary

    # Check prerequisites
    check_prerequisites

    echo ""
    log_info "Creating Kafka topics..."
    echo ""

    # Define topics to create
    declare -a TOPICS=(
        "task-events"
        "reminders"
        "task-updates"
        "dlq-task-events"
        "dlq-reminders"
        "dlq-task-updates"
    )

    # Create each topic
    for topic in "${TOPICS[@]}"; do
        create_topic "$topic" "$TOPIC_PARTITIONS" "$TOPIC_REPLICAS" "$RETENTION_MS"
    done

    echo ""
    log_info "Verifying topic creation..."
    verify_topics_created

    echo ""
    list_topics

    echo ""
    log_success "Kafka topics creation complete!"

    # Optional: Display detailed topic info
    if [ "${1:-}" = "--verbose" ]; then
        describe_all_topics
    fi
}

# Run main
main "$@"
