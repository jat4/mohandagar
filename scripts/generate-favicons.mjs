import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const masterSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#2563eb"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="12" flood-color="#06b6d4" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Background Base Container -->
  <rect x="16" y="16" width="480" height="480" rx="110" fill="#020617" stroke="url(#brandGrad)" stroke-width="16" filter="url(#glow)"/>

  <!-- Exact Runner Stopwatch (Lucide Timer) Icon -->
  <g transform="translate(64, 64) scale(16)" fill="none" stroke="#22d3ee" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="10" x2="14" y1="2" y2="2"/>
    <line x1="12" x2="15" y1="14" y2="11"/>
    <circle cx="12" cy="14" r="8"/>
  </g>
</svg>`;

const publicDir = path.resolve('public');

async function run() {
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Write favicon.svg
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), masterSvg.trim());
  console.log('Created favicon.svg');

  const svgBuffer = Buffer.from(masterSvg);

  const sizes = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'favicon-48x48.png', size: 48 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
    { name: 'favicon.ico', size: 32 }
  ];

  for (const item of sizes) {
    await sharp(svgBuffer)
      .resize(item.size, item.size)
      .png()
      .toFile(path.join(publicDir, item.name));
    console.log(`Generated ${item.name} (${item.size}x${item.size})`);
  }

  // Generate web manifest
  const manifest = {
    name: "Runner Stopwatch",
    short_name: "Stopwatch",
    description: "Multi-Checkpoint Race Timing & Split Chronometer",
    start_url: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#020617",
    icons: [
      {
        src: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png"
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      }
    ]
  };

  fs.writeFileSync(path.join(publicDir, 'site.webmanifest'), JSON.stringify(manifest, null, 2));
  console.log('Created site.webmanifest');
}

run().catch(console.error);
