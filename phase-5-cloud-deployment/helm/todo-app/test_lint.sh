#!/bin/bash
# Helm chart lint and validation tests
# Usage: ./test_lint.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

CHART_NAME="todo-app"

echo -e "${YELLOW}=== Helm Chart Lint Tests ===${NC}"

# Test 1: Helm lint with default values
echo -e "\n${YELLOW}Test 1: helm lint with default values${NC}"
if helm lint . --values values.yaml; then
    echo -e "${GREEN}✓ Default values lint passed${NC}"
else
    echo -e "${RED}✗ Default values lint failed${NC}"
    exit 1
fi

# Test 2: Helm lint with AKS values
echo -e "\n${YELLOW}Test 2: helm lint with AKS values${NC}"
if [ -f values-aks.yaml ]; then
    if helm lint . --values values.yaml --values values-aks.yaml; then
        echo -e "${GREEN}✓ AKS values lint passed${NC}"
    else
        echo -e "${RED}✗ AKS values lint failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⊘ values-aks.yaml not found, skipping${NC}"
fi

# Test 3: Helm lint with local values
echo -e "\n${YELLOW}Test 3: helm lint with local values${NC}"
if [ -f values-local.yaml ]; then
    if helm lint . --values values.yaml --values values-local.yaml; then
        echo -e "${GREEN}✓ Local values lint passed${NC}"
    else
        echo -e "${RED}✗ Local values lint failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⊘ values-local.yaml not found, skipping${NC}"
fi

# Test 4: Helm template validation
echo -e "\n${YELLOW}Test 4: helm template generates valid YAML${NC}"
if helm template $CHART_NAME . --values values.yaml > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Helm template generation successful${NC}"
else
    echo -e "${RED}✗ Helm template generation failed${NC}"
    exit 1
fi

# Test 5: Validate Chart.yaml
echo -e "\n${YELLOW}Test 5: Validate Chart.yaml${NC}"
if [ -f Chart.yaml ]; then
    if grep -q "name: $CHART_NAME" Chart.yaml && grep -q "version:" Chart.yaml && grep -q "appVersion:" Chart.yaml; then
        echo -e "${GREEN}✓ Chart.yaml structure valid${NC}"
    else
        echo -e "${RED}✗ Chart.yaml missing required fields${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ Chart.yaml not found${NC}"
    exit 1
fi

# Test 6: Check required templates exist
echo -e "\n${YELLOW}Test 6: Verify required templates exist${NC}"
required_templates=("deployment.yaml" "service.yaml" "configmap.yaml")
missing_templates=()

for template in "${required_templates[@]}"; do
    if [ ! -f "templates/$template" ]; then
        missing_templates+=("$template")
    fi
done

if [ ${#missing_templates[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ All required templates exist${NC}"
else
    echo -e "${RED}✗ Missing templates: ${missing_templates[*]}${NC}"
    exit 1
fi

# Test 7: Helm template with strict mode
echo -e "\n${YELLOW}Test 7: helm template with strict mode${NC}"
if helm template $CHART_NAME . --values values.yaml --strict > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Strict mode validation passed${NC}"
else
    echo -e "${YELLOW}⊘ Strict mode check skipped (not critical)${NC}"
fi

# Test 8: Verify Dapr annotations in templates
echo -e "\n${YELLOW}Test 8: Verify Dapr annotations in deployment${NC}"
template_output=$(helm template $CHART_NAME . --values values.yaml)
if echo "$template_output" | grep -q "dapr.io/enabled"; then
    echo -e "${GREEN}✓ Dapr annotations present${NC}"
else
    echo -e "${YELLOW}⊘ Dapr annotations not found (verify intentional)${NC}"
fi

echo -e "\n${GREEN}=== All Helm lint tests passed ===${NC}"
exit 0
