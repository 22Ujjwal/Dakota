#!/bin/bash

# Unity WebGL Build Update Script for Dakota Avatar
# This script copies the latest Unity WebGL build to the public directory

echo "🎭 Updating Dakota Unity Avatar Build..."

# Source directory (where Unity builds to)
SOURCE_DIR="/Users/ujjwalgupta/Documents/GitHub/Dakota/VirtualDakota/web/avatar-build/Build"

# Destination directory (where the web app expects files)
DEST_DIR="/Users/ujjwalgupta/Documents/GitHub/Dakota/public/webgl/Build"

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ Source directory not found: $SOURCE_DIR"
    echo "💡 Make sure you've built your Unity project to the web/avatar-build directory"
    exit 1
fi

# Check if build files exist
if [ ! -f "$SOURCE_DIR/WebGL Builds.data" ]; then
    echo "❌ Unity build files not found in: $SOURCE_DIR"
    echo "💡 Please build your Unity project first"
    exit 1
fi

# Create destination directory if it doesn't exist
mkdir -p "$DEST_DIR"

echo "📁 Copying build files..."

# Copy all build files
cp "$SOURCE_DIR/WebGL Builds.data" "$DEST_DIR/vdokota.data"
cp "$SOURCE_DIR/WebGL Builds.framework.js" "$DEST_DIR/vdokota.framework.js"  
cp "$SOURCE_DIR/WebGL Builds.loader.js" "$DEST_DIR/vdokota.loader.js"
cp "$SOURCE_DIR/WebGL Builds.wasm" "$DEST_DIR/vdokota.wasm"

echo "✅ Unity build files updated successfully!"
echo "🚀 Restart your server (npm start) to see the changes"
echo "🌐 Visit http://localhost:3000 and click the avatar button to test"

# Show file sizes for verification
echo ""
echo "📊 Build file sizes:"
ls -lh "$DEST_DIR"/*.{data,js,wasm} 2>/dev/null | awk '{print $5, $9}'