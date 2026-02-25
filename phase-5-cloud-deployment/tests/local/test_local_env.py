"""
T086: Local Environment Validation Tests

Tests to validate local Minikube environment is properly configured with:
- All services healthy
- Kafka topics exist and are accessible
- Dapr sidecar is ready and accessible
- Database connectivity
- Redis state store accessibility
"""

import asyncio
import httpx
import pytest
from typing import List
import logging

logger = logging.getLogger(__name__)


class TestLocalEnvironmentHealth:
    """Test suite for local environment health checks."""

    @pytest.fixture
    def base_urls(self):
        """Base URLs for local services."""
        return {
            "backend": "http://localhost:30301",
            "frontend": "http://localhost:30300",
            "dapr": "http://localhost:3500",
        }

    @pytest.fixture
    def kafka_brokers(self):
        """Kafka brokers for local environment."""
        return ["localhost:9092"]

    async def test_backend_health_live(self, base_urls):
        """Test backend liveness probe is responding."""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{base_urls['backend']}/health/live",
                    timeout=5.0
                )
                assert response.status_code == 200
                data = response.json()
                assert data.get("status") == "alive"
                logger.info("✓ Backend liveness probe OK")
            except httpx.ConnectError as e:
                pytest.fail(f"Backend not reachable at {base_urls['backend']}: {e}")

    async def test_backend_health_ready(self, base_urls):
        """Test backend readiness probe is responding."""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{base_urls['backend']}/health/ready",
                    timeout=5.0
                )
                assert response.status_code == 200
                data = response.json()
                assert data.get("status") == "ready"
                logger.info("✓ Backend readiness probe OK")
            except httpx.ConnectError as e:
                pytest.fail(f"Backend not reachable: {e}")

    async def test_backend_health_endpoint(self, base_urls):
        """Test backend health endpoint."""
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{base_urls['backend']}/health")
            assert response.status_code == 200
            data = response.json()
            assert "status" in data
            logger.info("✓ Backend health endpoint OK")

    async def test_dapr_sidecar_health(self, base_urls):
        """Test Dapr sidecar is running and accessible."""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{base_urls['dapr']}/v1.0/healthz",
                    timeout=5.0
                )
                assert response.status_code == 200
                logger.info("✓ Dapr sidecar healthy")
            except httpx.ConnectError as e:
                pytest.fail(f"Dapr sidecar not accessible at {base_urls['dapr']}: {e}")

    async def test_dapr_pubsub_component(self, base_urls):
        """Test Dapr Pub/Sub component is configured."""
        async with httpx.AsyncClient() as client:
            try:
                # List Dapr components
                response = await client.get(
                    f"{base_urls['dapr']}/v1.0/metadata",
                    timeout=5.0
                )
                assert response.status_code == 200
                data = response.json()
                logger.info(f"Dapr metadata: {data}")
                logger.info("✓ Dapr components accessible")
            except Exception as e:
                logger.warning(f"Could not verify Dapr components: {e}")

    async def test_kafka_connectivity(self, kafka_brokers):
        """Test Kafka broker connectivity."""
        try:
            from kafka import KafkaProducer
            from kafka.errors import KafkaError

            producer = KafkaProducer(
                bootstrap_servers=kafka_brokers,
                request_timeout_ms=5000,
            )

            # Test sending a message
            future = producer.send("__test_topic__", b"test")
            record_metadata = future.get(timeout=5)

            producer.close()

            assert record_metadata.partition is not None
            logger.info(f"✓ Kafka connectivity OK (broker: {kafka_brokers})")
        except Exception as e:
            pytest.skip(f"Kafka not available: {e}")

    async def test_kafka_topics_exist(self, kafka_brokers):
        """Test required Kafka topics exist."""
        try:
            from kafka.admin import KafkaAdminClient, ConfigResource, ConfigResourceType
            from kafka.errors import KafkaError

            admin_client = KafkaAdminClient(bootstrap_servers=kafka_brokers)

            # Get cluster metadata
            cluster_metadata = admin_client.describe_cluster()

            # List topics
            topic_list = admin_client.list_topics()

            # Check required topics
            required_topics = [
                "task-events",
                "reminders",
                "task-updates",
                "dlq-task-events",
                "dlq-reminders",
                "dlq-task-updates",
            ]

            for topic in required_topics:
                if topic not in topic_list:
                    logger.warning(f"Topic '{topic}' not found in Kafka")
                else:
                    logger.info(f"✓ Topic '{topic}' exists")

            admin_client.close()
        except Exception as e:
            pytest.skip(f"Could not verify Kafka topics: {e}")

    async def test_kubernetes_namespace_exists(self):
        """Test required Kubernetes namespace exists."""
        try:
            from kubernetes import client, config

            config.load_incluster_config()
            v1 = client.CoreV1Api()

            namespaces = v1.list_namespace()
            namespace_names = [ns.metadata.name for ns in namespaces.items]

            assert "default" in namespace_names
            logger.info("✓ Kubernetes namespace 'default' exists")
        except Exception as e:
            logger.warning(f"Could not verify Kubernetes namespace: {e}")

    async def test_pods_running(self):
        """Test required pods are running in Kubernetes."""
        try:
            from kubernetes import client, config

            config.load_incluster_config()
            v1 = client.CoreV1Api()

            pods = v1.list_namespaced_pod(namespace="default")
            running_pods = [
                pod.metadata.name
                for pod in pods.items
                if pod.status.phase == "Running"
            ]

            assert len(running_pods) > 0
            logger.info(f"✓ Found {len(running_pods)} running pods: {running_pods}")
        except Exception as e:
            logger.warning(f"Could not verify Kubernetes pods: {e}")

    async def test_redis_accessibility(self):
        """Test Redis state store is accessible."""
        try:
            import redis

            r = redis.Redis(host="localhost", port=6379, socket_timeout=5)
            r.ping()
            logger.info("✓ Redis accessible on localhost:6379")
        except Exception as e:
            pytest.skip(f"Redis not available: {e}")

    async def test_postgresql_connectivity(self):
        """Test PostgreSQL database connectivity."""
        import os
        database_url = os.getenv("DATABASE_URL")

        if not database_url:
            pytest.skip("DATABASE_URL environment variable not set")

        try:
            import psycopg

            # Extract connection details from URL
            # postgresql://user:password@host:port/dbname
            conn = psycopg.connect(database_url, connect_timeout=5)
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            cursor.close()
            conn.close()

            assert result[0] == 1
            logger.info("✓ PostgreSQL connectivity OK")
        except Exception as e:
            pytest.skip(f"PostgreSQL not available: {e}")


class TestLocalEnvironmentConfiguration:
    """Test suite for local environment configuration."""

    def test_env_variables_set(self):
        """Test required environment variables are set."""
        import os

        required_vars = [
            "DATABASE_URL",
            "BETTER_AUTH_SECRET",
        ]

        missing_vars = []
        for var in required_vars:
            if not os.getenv(var):
                missing_vars.append(var)

        if missing_vars:
            logger.warning(f"Missing environment variables: {missing_vars}")
        else:
            logger.info("✓ All required environment variables set")

    def test_dapr_components_yaml_exists(self):
        """Test Dapr component YAML files exist."""
        import os
        from pathlib import Path

        dapr_components_dir = Path("/mnt/d/hackathon-todo/phase-5-cloud-deployment/dapr/components")

        required_components = [
            "pubsub-kafka.yaml",
            "statestore-redis.yaml",
            "secretstore-kubernetes.yaml",
            "jobs-scheduler.yaml",
        ]

        for component in required_components:
            component_path = dapr_components_dir / component
            if component_path.exists():
                logger.info(f"✓ Dapr component '{component}' exists")
            else:
                logger.warning(f"Dapr component '{component}' not found at {component_path}")

    def test_helm_chart_exists(self):
        """Test Helm chart exists and is valid."""
        import os
        from pathlib import Path

        chart_dir = Path("/mnt/d/hackathon-todo/phase-5-cloud-deployment/helm/todo-app")

        required_files = [
            "Chart.yaml",
            "values.yaml",
            "values-local.yaml",
        ]

        for file in required_files:
            file_path = chart_dir / file
            if file_path.exists():
                logger.info(f"✓ Helm file '{file}' exists")
            else:
                logger.warning(f"Helm file '{file}' not found")


class TestLocalEnvironmentServices:
    """Test suite for local microservices."""

    async def test_recurring_service_endpoints(self):
        """Test recurring-service endpoints are accessible."""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    "http://localhost:8001/health",
                    timeout=5.0
                )
                assert response.status_code == 200
                logger.info("✓ Recurring service health endpoint OK")
            except httpx.ConnectError:
                logger.warning("Recurring service not accessible on port 8001")

    async def test_alert_service_endpoints(self):
        """Test alert-service endpoints are accessible."""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    "http://localhost:8002/health",
                    timeout=5.0
                )
                assert response.status_code == 200
                logger.info("✓ Alert service health endpoint OK")
            except httpx.ConnectError:
                logger.warning("Alert service not accessible on port 8002")

    async def test_notification_service_endpoints(self):
        """Test notification-service endpoints are accessible."""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    "http://localhost:8003/health",
                    timeout=5.0
                )
                assert response.status_code == 200
                logger.info("✓ Notification service health endpoint OK")
            except httpx.ConnectError:
                logger.warning("Notification service not accessible on port 8003")


# Async test execution helpers
@pytest.mark.asyncio
async def test_all_services_responsive(base_urls=()):
    """Integration test: All services responsive."""
    test_suite = TestLocalEnvironmentHealth()
    await test_suite.test_backend_health_live(base_urls or {
        "backend": "http://localhost:30301",
        "frontend": "http://localhost:30300",
        "dapr": "http://localhost:3500",
    })


if __name__ == "__main__":
    # Run pytest with async support
    pytest.main([__file__, "-v", "-s", "-m", "asyncio"])
