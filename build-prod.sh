#!/bin/bash
# Build script for production images
# Usage: ./build-prod.sh [BASE_URL]
# Example: ./build-prod.sh https://plane.blitztechnology.tech
#          ./build-prod.sh http://10.20.0.11:8082

set -e

REGISTRY="docker-registry.blitztechnology.tech"
PROJECT="brajakara-aviao"
TAG="prod"
BASE_URL="${1:-http://10.20.0.11:8082}"  # Default to 10.20.0.11:8082 if not provided

echo "=== Building Plane Production Images ==="
echo "Registry: $REGISTRY"
echo "Project: $PROJECT"
echo "Tag: $TAG"
echo "Base URL: $BASE_URL"
echo ""

# 1. Build Web
echo "Building plane-web..."
docker build \
  --build-arg VITE_API_BASE_URL="$BASE_URL" \
  --build-arg VITE_ADMIN_BASE_URL="$BASE_URL" \
  --build-arg VITE_SPACE_BASE_URL="$BASE_URL" \
  --build-arg VITE_WEB_BASE_URL="$BASE_URL" \
  -f apps/web/Dockerfile.web \
  -t "$REGISTRY/$PROJECT/plane-web:$TAG" .
echo "✓ plane-web built"

# 2. Build Admin
echo "Building plane-admin..."
docker build \
  --build-arg VITE_API_BASE_URL="$BASE_URL" \
  --build-arg VITE_ADMIN_BASE_URL="$BASE_URL" \
  --build-arg VITE_SPACE_BASE_URL="$BASE_URL" \
  -f apps/admin/Dockerfile.admin \
  -t "$REGISTRY/$PROJECT/plane-admin:$TAG" .
echo "✓ plane-admin built"

# 3. Build API-TS
echo "Building plane-api-ts..."
docker build \
  -f apps/api-ts/Dockerfile \
  -t "$REGISTRY/$PROJECT/plane-api-ts:$TAG" \
  apps/api-ts/
echo "✓ plane-api-ts built"

# 4. Build Chat
echo "Building plane-chat-backend..."
docker build \
  -f apps/chat-backend/Dockerfile \
  -t "$REGISTRY/$PROJECT/plane-chat-backend:$TAG" \
  apps/chat-backend/
echo "✓ plane-chat-backend built"

# 5. Build Proxy
echo "Building plane-proxy..."
docker build \
  -f apps/proxy-ts/Dockerfile \
  -t "$REGISTRY/$PROJECT/plane-proxy:$TAG" \
  apps/proxy-ts/
echo "✓ plane-proxy built"

echo ""
echo "=== Pushing to Registry ==="

docker push "$REGISTRY/$PROJECT/plane-web:$TAG"
echo "✓ plane-web pushed"

docker push "$REGISTRY/$PROJECT/plane-admin:$TAG"
echo "✓ plane-admin pushed"

docker push "$REGISTRY/$PROJECT/plane-api-ts:$TAG"
echo "✓ plane-api-ts pushed"

docker push "$REGISTRY/$PROJECT/plane-chat-backend:$TAG"
echo "✓ plane-chat-backend pushed"

docker push "$REGISTRY/$PROJECT/plane-proxy:$TAG"
echo "✓ plane-proxy pushed"

echo ""
echo "=== Build & Push Complete ==="
echo "All images ready for deployment"
