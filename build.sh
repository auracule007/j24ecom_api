#!/usr/bin/env bash
# build.sh

# Exit if any command fails
set -e

echo "🚀 Installing dependencies..."
npm install

echo "🔄 Generating Prisma client..."
npx prisma generate

echo "📦 Building project (if using TypeScript)..."
if [ -f tsconfig.json ]; then
  npx tsc
fi

echo "✅ Build completed!"
