// electron/preload.js
const { contextBridge } = require("electron");
const path = require("path");
const fs = require("fs");

const baseDir = "C:\\Rantsija";

const videoDir = path.join(baseDir, "videos");
const kmlDir = path.join(baseDir, "kml");

// Create folders if missing
if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });
if (!fs.existsSync(kmlDir)) fs.mkdirSync(kmlDir, { recursive: true });

contextBridge.exposeInMainWorld("api", {
  listVideos: () => {
    if (!fs.existsSync(videoDir)) return [];
    return fs
      .readdirSync(videoDir)
      .filter((f) => f.toLowerCase().endsWith(".mp4"));
  },

  listKml: () => {
    if (!fs.existsSync(kmlDir)) return [];
    return fs
      .readdirSync(kmlDir)
      .filter((f) => f.toLowerCase().endsWith(".kml"));
  },

  getVideoPath: (file) => path.join(videoDir, file),
  getKmlPath: (file) => path.join(kmlDir, file),
});
