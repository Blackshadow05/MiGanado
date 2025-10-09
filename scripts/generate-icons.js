const fs = require('fs');
const path = require('path');

// Simple function to create a basic icon programmatically
function createBasicIcon(size) {
  const canvas = `<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <circle cx="256" cy="256" r="240" fill="#10b981" stroke="#059669" stroke-width="8"/>
    <g transform="translate(256, 256)">
      <ellipse cx="0" cy="20" rx="${80 * size/512}" ry="${70 * size/512}" fill="white" opacity="0.9"/>
      <ellipse cx="${-50 * size/512}" cy="${-30 * size/512}" rx="${25 * size/512}" ry="${35 * size/512}" fill="white" opacity="0.9" transform="rotate(-20)"/>
      <ellipse cx="${50 * size/512}" cy="${-30 * size/512}" rx="${25 * size/512}" ry="${35 * size/512}" fill="white" opacity="0.9" transform="rotate(20)"/>
      <circle cx="${-25 * size/512}" cy="0" r="${8 * size/512}" fill="#1f2937"/>
      <circle cx="${25 * size/512}" cy="0" r="${8 * size/512}" fill="#1f2937"/>
      <ellipse cx="0" cy="${35 * size/512}" rx="${30 * size/512}" ry="${25 * size/512}" fill="#f3f4f6" opacity="0.8"/>
      <ellipse cx="${-8 * size/512}" cy="${35 * size/512}" rx="${4 * size/512}" ry="${6 * size/512}" fill="#1f2937"/>
      <ellipse cx="${8 * size/512}" cy="${35 * size/512}" rx="${4 * size/512}" ry="${6 * size/512}" fill="#1f2937"/>
      <path d="M ${-15 * size/512} ${45 * size/512} Q 0 ${50 * size/512} ${15 * size/512} ${45 * size/512}" stroke="#1f2937" stroke-width="3" fill="none"/>
      <path d="M ${-40 * size/512} ${-50 * size/512} L ${-35 * size/512} ${-80 * size/512}" stroke="#fbbf24" stroke-width="8" stroke-linecap="round"/>
      <path d="M ${40 * size/512} ${-50 * size/512} L ${35 * size/512} ${-80 * size/512}" stroke="#fbbf24" stroke-width="8" stroke-linecap="round"/>
    </g>
  </svg>`;
  
  return canvas;
}

// Icon sizes needed for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate icons for each size
iconSizes.forEach(size => {
  const iconContent = createBasicIcon(size);
  const iconPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
  
  fs.writeFileSync(iconPath, iconContent);
  console.log(`Generated icon: icon-${size}x${size}.svg`);
});

console.log('All PWA icons generated successfully!');