# Icon Generation Guide

## Overview

The extension logo is defined as an SVG file in `extension/icons/logo.svg`. You need to convert this to PNG files in multiple sizes for Chrome Extension.

## Required Icon Sizes

- `icon16.png` - 16x16px (toolbar, small displays)
- `icon32.png` - 32x32px (Windows taskbar)
- `icon48.png` - 48x48px (extension management page)
- `icon128.png` - 128x128px (Chrome Web Store, installation)

## Method 1: Online SVG to PNG Converter (Easiest)

1. Visit: https://svgtopng.com/ or https://cloudconvert.com/svg-to-png
2. Upload `extension/icons/logo.svg`
3. Generate PNG files at each required size:
   - 16x16
   - 32x32
   - 48x48
   - 128x128
4. Download and save to `extension/icons/` folder

## Method 2: Using Inkscape (Recommended for Quality)

```bash
# Install Inkscape (if not installed)
# Ubuntu/Debian: sudo apt-get install inkscape
# Mac: brew install inkscape
# Windows: Download from https://inkscape.org/

# Convert SVG to PNG at different sizes
inkscape -w 16 -h 16 extension/icons/logo.svg -o extension/icons/icon16.png
inkscape -w 32 -h 32 extension/icons/logo.svg -o extension/icons/icon32.png
inkscape -w 48 -h 48 extension/icons/logo.svg -o extension/icons/icon48.png
inkscape -w 128 -h 128 extension/icons/logo.svg -o extension/icons/icon128.png
```

## Method 3: Using ImageMagick

```bash
# Install ImageMagick (if not installed)
# Ubuntu/Debian: sudo apt-get install imagemagick
# Mac: brew install imagemagick
# Windows: Download from https://imagemagick.org/

# Convert SVG to PNG
convert -background none -resize 16x16 extension/icons/logo.svg extension/icons/icon16.png
convert -background none -resize 32x32 extension/icons/logo.svg extension/icons/icon32.png
convert -background none -resize 48x48 extension/icons/logo.svg extension/icons/icon48.png
convert -background none -resize 128x128 extension/icons/logo.svg extension/icons/icon128.png
```

## Method 4: Using Node.js (sharp library)

```bash
# Install sharp
npm install sharp

# Create script (generate-icons.js)
```

```javascript
const sharp = require('sharp');
const fs = require('fs');

const sizes = [16, 32, 48, 128];
const svgBuffer = fs.readFileSync('extension/icons/logo.svg');

sizes.forEach(size => {
  sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(`extension/icons/icon${size}.png`)
    .then(() => console.log(`Generated icon${size}.png`))
    .catch(err => console.error(`Error generating icon${size}.png:`, err));
});
```

```bash
# Run the script
node generate-icons.js
```

## Verification

After generating icons, verify they exist:

```bash
ls -lh extension/icons/*.png
```

You should see:
- icon16.png
- icon32.png
- icon48.png
- icon128.png

## Temporary Placeholder (Optional)

If you can't generate icons right away, you can use placeholder images temporarily. The extension will still work, just with default Chrome extension icons.

## Current Logo Design

The logo features:
- 🎴 **Gradient background** (purple to blue)
- 📇 **Stack of Anki cards** with 3D effect
- ✨ **Letter "A"** in center
- 🌟 **Sparkle effects** for learning visualization
- 📚 **Book icon** representing vocabulary

Colors:
- Primary: #667eea (purple-blue)
- Secondary: #764ba2 (purple)
- Accent: #fbbf24 (yellow/gold for sparkles)
- Success: #10b981 (green for book)

---

**Note**: Once icons are generated, the extension will be ready for production use!
