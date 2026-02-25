#!/bin/bash

# Phase 6 Verification Script
# This script verifies that all Phase 6 tasks have been completed

echo "========================================="
echo "Phase 6: Task Management Dashboard"
echo "Verification Script"
echo "========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Function to check file exists
check_file() {
    local file=$1
    local description=$2

    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $description"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} $description - File not found: $file"
        ((FAILED++))
        return 1
    fi
}

echo "Checking E2E Tests (T065-T069)..."
echo "--------------------------------"
check_file "__tests__/e2e/task-create.spec.ts" "T065: Task creation E2E test"
check_file "__tests__/e2e/task-update.spec.ts" "T066: Task update E2E test"
check_file "__tests__/e2e/task-delete.spec.ts" "T067: Task deletion E2E test"
check_file "__tests__/e2e/task-toggle.spec.ts" "T068: Task toggle E2E test"
check_file "__tests__/e2e/task-error-handling.spec.ts" "T069: Error handling E2E test"
echo ""

echo "Checking Server Actions (T070-T076)..."
echo "--------------------------------------"
check_file "actions/tasks.ts" "T070-T076: Task Server Actions"

# Check if specific functions exist
if [ -f "actions/tasks.ts" ]; then
    if grep -q "export async function fetchTasks" actions/tasks.ts; then
        echo -e "${GREEN}✓${NC} T070: fetchTasks() function exists"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} T070: fetchTasks() function not found"
        ((FAILED++))
    fi

    if grep -q "export async function createTask" actions/tasks.ts; then
        echo -e "${GREEN}✓${NC} T071: createTask() function exists"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} T071: createTask() function not found"
        ((FAILED++))
    fi

    if grep -q "export async function updateTask" actions/tasks.ts; then
        echo -e "${GREEN}✓${NC} T072: updateTask() function exists"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} T072: updateTask() function not found"
        ((FAILED++))
    fi

    if grep -q "export async function deleteTask" actions/tasks.ts; then
        echo -e "${GREEN}✓${NC} T073: deleteTask() function exists"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} T073: deleteTask() function not found"
        ((FAILED++))
    fi

    if grep -q "export async function toggleTaskComplete" actions/tasks.ts; then
        echo -e "${GREEN}✓${NC} T074: toggleTaskComplete() function exists"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} T074: toggleTaskComplete() function not found"
        ((FAILED++))
    fi
fi
echo ""

echo "Checking UI Components (T077-T080)..."
echo "-------------------------------------"
check_file "components/tasks/task-list.tsx" "T077: TaskList component"
check_file "components/tasks/task-item.tsx" "T078: TaskItem component"
check_file "components/tasks/task-form.tsx" "T079: TaskForm component"
check_file "components/tasks/empty-state.tsx" "T080: EmptyState component"
echo ""

echo "Checking Dashboard Pages (T081-T082)..."
echo "---------------------------------------"
check_file "app/dashboard/page.tsx" "T081: Dashboard page"
check_file "app/dashboard/layout.tsx" "T082: Dashboard layout"
echo ""

echo "Checking Polish Features (T083-T088)..."
echo "---------------------------------------"

# Check for useOptimistic
if [ -f "components/tasks/task-item.tsx" ]; then
    if grep -q "useOptimistic" components/tasks/task-item.tsx; then
        echo -e "${GREEN}✓${NC} T083: useOptimistic hook implemented"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} T083: useOptimistic hook not found"
        ((FAILED++))
    fi
fi

# Check for error rollback logic
if [ -f "components/tasks/task-item.tsx" ]; then
    if grep -q "rollback\|setOptimisticTask" components/tasks/task-item.tsx; then
        echo -e "${GREEN}✓${NC} T084: Error rollback logic present"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} T084: Error rollback logic not found"
        ((FAILED++))
    fi
fi

# Check for Dialog component (delete confirmation)
if [ -f "components/tasks/task-item.tsx" ]; then
    if grep -q "Dialog\|DialogContent" components/tasks/task-item.tsx; then
        echo -e "${GREEN}✓${NC} T085: Delete confirmation dialog implemented"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} T085: Delete confirmation dialog not found"
        ((FAILED++))
    fi
fi

# Check for form validation
if [ -f "components/tasks/task-form.tsx" ]; then
    if grep -q "zodResolver\|z.object" components/tasks/task-form.tsx; then
        echo -e "${GREEN}✓${NC} T086: Form validation with Zod implemented"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} T086: Form validation not found"
        ((FAILED++))
    fi
fi

# Check for loading states
if [ -f "components/tasks/task-item.tsx" ] && [ -f "components/tasks/task-form.tsx" ]; then
    if grep -q "isPending\|isLoading\|Loader2" components/tasks/task-item.tsx && \
       grep -q "isPending\|isLoading\|Loader2" components/tasks/task-form.tsx; then
        echo -e "${GREEN}✓${NC} T087: Loading states implemented"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} T087: Loading states not found"
        ((FAILED++))
    fi
fi

# Check for toast error handling
if [ -f "components/tasks/task-form.tsx" ] && [ -f "components/tasks/task-item.tsx" ]; then
    if grep -q "toast.error" components/tasks/task-form.tsx && \
       grep -q "toast.error" components/tasks/task-item.tsx; then
        echo -e "${GREEN}✓${NC} T088: Error toast notifications implemented"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} T088: Error toast notifications not found"
        ((FAILED++))
    fi
fi

echo ""
echo "========================================="
echo "Verification Summary"
echo "========================================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All Phase 6 tasks completed successfully!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tasks are incomplete. Please review the failures above.${NC}"
    exit 1
fi
