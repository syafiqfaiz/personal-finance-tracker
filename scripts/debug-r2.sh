#!/bin/bash

echo "🔍 Debugging R2 Setup"
echo "===================="
echo ""

# Check if wrangler is running
if lsof -Pi :8788 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Wrangler is running on port 8788"
else
    echo "❌ Wrangler is NOT running"
    exit 1
fi

echo ""
echo "📦 Checking R2 bucket contents..."
npx wrangler r2 object list belanja-storage --limit 10

echo ""
echo "🔑 Recent uploads (user_storage/)..."
npx wrangler r2 object list belanja-storage --prefix="user_storage/" --limit 5

echo ""
echo "💡 To fix the issue, restart wrangler with:"
echo "   npx wrangler pages dev dist --r2=belanja-storage"
