#!/bin/bash

# Script to convert SVG icons to PNG format
# Requires ImageMagick to be installed

echo "Converting SVG icons to PNG..."

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "Error: ImageMagick is not installed."
    echo "Please install ImageMagick:"
    echo "  macOS: brew install imagemagick"
    echo "  Linux: sudo apt-get install imagemagick"
    echo ""
    echo "Alternatively, use an online converter:"
    echo "  - https://cloudconvert.com/svg-to-png"
    echo "  - https://convertio.co/svg-png/"
    exit 1
fi

# Convert extension icon
if [ -f "assets/icon.svg" ]; then
    echo "Converting icon.svg to icon.png (512x512)..."
    convert assets/icon.svg -resize 512x512 assets/icon.png
    echo "✓ icon.png created"
else
    echo "⚠ assets/icon.svg not found"
fi

# Convert Claude logo
if [ -f "assets/claude-logo.svg" ]; then
    echo "Converting claude-logo.svg to claude-logo.png (64x64)..."
    convert assets/claude-logo.svg -resize 64x64 assets/claude-logo.png
    echo "✓ claude-logo.png created"
else
    echo "⚠ assets/claude-logo.svg not found"
fi

# Convert JetBrains Junie logo
if [ -f "assets/junie-logo.svg" ]; then
    echo "Converting junie-logo.svg to junie-logo.png (64x64)..."
    convert assets/junie-logo.svg -resize 64x64 assets/junie-logo.png
    echo "✓ junie-logo.png created"
else
    echo "⚠ assets/junie-logo.svg not found"
fi

# Convert GitHub Copilot logo
if [ -f "assets/copilot-logo.svg" ]; then
    echo "Converting copilot-logo.svg to copilot-logo.png (64x64)..."
    convert assets/copilot-logo.svg -resize 64x64 assets/copilot-logo.png
    echo "✓ copilot-logo.png created"
else
    echo "⚠ assets/copilot-logo.svg not found"
fi

# Convert Google Gemini logo
if [ -f "assets/gemini-logo.svg" ]; then
    echo "Converting gemini-logo.svg to gemini-logo.png (64x64)..."
    convert assets/gemini-logo.svg -resize 64x64 assets/gemini-logo.png
    echo "✓ gemini-logo.png created"
else
    echo "⚠ assets/gemini-logo.svg not found"
fi

echo ""
echo "Icon conversion complete!"
echo "You can now build the extension with: npm run build"
