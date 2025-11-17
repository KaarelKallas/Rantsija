const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Directories
const SOURCE_DIR = path.resolve(__dirname, "../public/videos");
const DEST_DIR = path.resolve(__dirname, "../public/videos/fixed");

// Create output folder if it doesn't exist
if (!fs.existsSync(DEST_DIR)) {
  fs.mkdirSync(DEST_DIR, { recursive: true });
}

// Normalize filenames (remove accents, lowercase, replace spaces)
function normalizeStr(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ") // keep letters/numbers
    .trim();
}

function friendlyFilename(str) {
  return normalizeStr(str).replace(/\s+/g, "-");
}

// Get all video files
const files = fs
  .readdirSync(SOURCE_DIR)
  .filter((f) => /\.(mp4|mov|mkv|avi|wmv|m4v)$/i.test(f));

if (files.length === 0) {
  console.log("⚠ No video files found in", SOURCE_DIR);
  process.exit(0);
}

console.log(`\n🎬 Processing ${files.length} videos...\n`);

const mapping = [];

files.forEach((file) => {
  const ext = path.extname(file);
  const base = path.basename(file, ext);

  const cleaned = friendlyFilename(base);
  const outName = cleaned + ".mp4";

  const inputPath = path.join(SOURCE_DIR, file);
  const outputPath = path.join(DEST_DIR, outName);

  // Check if input file exists
  if (!fs.existsSync(inputPath)) {
    console.warn(`⚠ Skipping missing video: ${file}`);
    return;
  }

  console.log(`➡ Processing: ${file}`);
  console.log(`   → ${outName}`);

  try {
    // FFmpeg command
    const cmd = `ffmpeg -y -i "${inputPath}" ` +
      `-vf "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease,` +
      `pad=ceil(iw/2)*2:ceil(ih/2)*2" ` + // ensures width & height divisible by 2
      `-c:v libx264 -preset fast -b:v 6M ` +
      `-c:a aac -b:a 192k ` +
      `-movflags +faststart ` +
      `"${outputPath}"`;

    execSync(cmd, { stdio: "inherit" }); // real-time FFmpeg output

    mapping.push({ original: file, final: outName });
    console.log(`✔ Finished: ${outName}\n`);
  } catch (err) {
    console.error(`❌ Failed to process ${file}`);
    console.error(err.message);
  }
});

// Save mapping
fs.writeFileSync(
  path.join(DEST_DIR, "video-map.json"),
  JSON.stringify(mapping, null, 2)
);

console.log("\n🔥 All videos processed!");
console.log(`📄 Mapping saved → ${path.join(DEST_DIR, "video-map.json")}\n`);
