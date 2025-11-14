// scripts/process-videos.cjs
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const crypto = require("crypto");
const readline = require("readline");

const SOURCE_DIR = "public/videos";
const DEST_DIR = "public/videos/fixed";

if (!fs.existsSync(DEST_DIR)) fs.mkdirSync(DEST_DIR, { recursive: true });

function normalizeStr(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function friendlyFilename(str) {
  return normalizeStr(str).replace(/\s+/g, "-");
}

function sha1File(filePath) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash("sha1").update(data).digest("hex");
}

function checkVideo(filePath) {
  try {
    execSync(`ffprobe -v error -show_entries format=duration "${filePath}"`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

// Load existing mapping
const mappingFile = path.join(DEST_DIR, "video-map.json");
const mapping = fs.existsSync(mappingFile)
  ? JSON.parse(fs.readFileSync(mappingFile))
  : {};

const files = fs
  .readdirSync(SOURCE_DIR)
  .filter((f) => /\.(mp4|mov|mkv|avi|wmv|m4v)$/i.test(f));

console.log(`\n🎬 Processing ${files.length} videos...\n`);

files.forEach((file, index) => {
  const ext = path.extname(file);
  const base = path.basename(file, ext);
  const cleaned = friendlyFilename(base);
  const outputPath = path.join(DEST_DIR, cleaned + ".mp4");
  const inputPath = path.join(SOURCE_DIR, file);
  const checksum = sha1File(inputPath);

  // Skip if already processed and checksum matches
  if (mapping[file]?.checksum === checksum && fs.existsSync(outputPath)) {
    console.log(`⏩ Skipping (up-to-date): ${file}`);
    return;
  }

  // Check if input is valid
  if (!checkVideo(inputPath)) {
    console.log(`⚠ Skipping corrupted video: ${file}`);
    return;
  }

  console.log(`➡ Processing (${index + 1}/${files.length}): ${file}`);
  try {
    execSync(
      `ffmpeg -y -i "${inputPath}" \
        -vf "scale='if(gt(iw,1920),1920,iw)':'if(gt(ih,1080),1080,ih)':force_original_aspect_ratio=decrease,setsar=1,pad=ceil(iw/2)*2:ceil(ih/2)*2:(ow-iw)/2:(oh-ih)/2" \
        -c:v libx264 -preset fast -b:v 6M \
        -c:a aac -b:a 192k \
        -movflags +faststart \
        "${outputPath}"`,
      { stdio: "inherit" }
    );

    mapping[file] = { final: cleaned + ".mp4", checksum };
    console.log(`✔ Finished: ${cleaned}.mp4\n`);
  } catch (err) {
    console.error(`❌ Failed to process ${file}`, err);
  }
});

fs.writeFileSync(mappingFile, JSON.stringify(mapping, null, 2));
console.log("\n🔥 All videos processed!");
console.log(`📄 Mapping saved → ${mappingFile}\n`);
