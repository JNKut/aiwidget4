#!/bin/bash

# AI Chat Widget Deployment Script
echo "🚀 Starting deployment process..."

# Check if required environment variables are set
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ Error: OPENAI_API_KEY environment variable is not set"
    exit 1
fi

if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo "🌐 Your AI chat widget is ready for deployment"
    echo "📱 Widget URL will be: https://your-domain.com/widget"
else
    echo "❌ Build failed!"
    exit 1
fi

echo "🎉 Deployment preparation complete!"