#!/bin/bash
# Rebuild frontend image with fixed next.config.ts
# Run this script to rebuild the frontend image with the proxy pattern fix

set -e

echo "=== Rebuilding Frontend Image with Fixed Config ==="
echo ""

# Navigate to project root
cd "$(dirname "$0")"

echo "Step 1: Configure Docker to use Minikube daemon..."
eval $(minikube docker-env) || {
    echo "ERROR: Minikube not accessible"
    echo "Try running: minikube start"
    exit 1
}

echo "Step 2: Building frontend image..."
docker build -t todo-frontend:latest ./frontend

echo "Step 3: Verifying image..."
docker images | grep todo-frontend

echo ""
echo "=== Build Complete! ==="
echo ""
echo "Next steps:"
echo "  1. Restart frontend deployment:"
echo "     kubectl rollout restart deployment/todo-app-frontend -n todo-app"
echo ""
echo "  2. Wait for pods to be ready:"
echo "     kubectl rollout status deployment/todo-app-frontend -n todo-app"
echo ""
echo "  3. Access application:"
echo "     http://172.24.21.3:3000"
echo ""
