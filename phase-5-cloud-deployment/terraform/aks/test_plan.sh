#!/bin/bash
# Terraform validation and planning tests for Azure AKS
# Usage: ./test_plan.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${YELLOW}=== Terraform Validation Tests ===${NC}"

# Test 1: Terraform validate
echo -e "\n${YELLOW}Test 1: terraform validate${NC}"
if terraform validate; then
    echo -e "${GREEN}✓ Terraform syntax valid${NC}"
else
    echo -e "${RED}✗ Terraform syntax validation failed${NC}"
    exit 1
fi

# Test 2: Terraform fmt check (no changes needed)
echo -e "\n${YELLOW}Test 2: terraform fmt check${NC}"
if terraform fmt -check -recursive; then
    echo -e "${GREEN}✓ Terraform formatting correct${NC}"
else
    echo -e "${RED}✗ Terraform formatting issues found (run: terraform fmt -recursive)${NC}"
    exit 1
fi

# Test 3: Terraform init
echo -e "\n${YELLOW}Test 3: terraform init${NC}"
if terraform init -backend=false; then
    echo -e "${GREEN}✓ Terraform initialized${NC}"
else
    echo -e "${RED}✗ Terraform init failed${NC}"
    exit 1
fi

# Test 4: Terraform plan (dry run)
echo -e "\n${YELLOW}Test 4: terraform plan (dry run)${NC}"
if terraform plan -var-file="terraform.tfvars.example" -out=tfplan -no-color 2>/dev/null; then
    echo -e "${GREEN}✓ Terraform plan successful${NC}"
    rm -f tfplan
else
    echo -e "${RED}✗ Terraform plan failed${NC}"
    exit 1
fi

# Test 5: Check required variables are defined
echo -e "\n${YELLOW}Test 5: Verify required variables are defined${NC}"
required_vars=("location" "environment" "node_count")
missing_vars=()

for var in "${required_vars[@]}"; do
    if ! grep -q "variable \"$var\"" variables.tf; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ All required variables defined${NC}"
else
    echo -e "${RED}✗ Missing variables: ${missing_vars[*]}${NC}"
    exit 1
fi

# Test 6: Check outputs are defined
echo -e "\n${YELLOW}Test 6: Verify outputs are defined${NC}"
required_outputs=("kube_config" "cluster_name" "resource_group_name")
missing_outputs=()

for output in "${required_outputs[@]}"; do
    if ! grep -q "output \"$output\"" outputs.tf; then
        missing_outputs+=("$output")
    fi
done

if [ ${#missing_outputs[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ All required outputs defined${NC}"
else
    echo -e "${RED}✗ Missing outputs: ${missing_outputs[*]}${NC}"
    exit 1
fi

echo -e "\n${GREEN}=== All Terraform tests passed ===${NC}"
exit 0
