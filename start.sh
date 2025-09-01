#!/usr/bin/env bash
# start.sh

# Exit if any command fails
set -e

echo "📢 Running database migrations..."
npx prisma migrate deploy

echo "🚀 Starting server..."
node server.js
