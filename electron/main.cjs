const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");   // <-- REQUIRED

const EXTERNAL_BASE = "C:\\rantsija"; // your external folder

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (!app.isPackaged) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

// -------------------- IPC PATHS --------------------

ipcMain.handle("get-kml-path", () => {
  return path.join(EXTERNAL_BASE, "kml");
});

ipcMain.handle("get-video-path", () => {
  return path.join(EXTERNAL_BASE, "videos");
});

// -------------------- VIDEO LISTING --------------------

ipcMain.handle("list-videos", () => {
  try {
    const folder = path.join(EXTERNAL_BASE, "videos");
    console.log("📁 Checking video folder:", folder);

    if (!fs.existsSync(folder)) {
      console.log("❌ Folder does NOT exist:", folder);
      return [];
    }

    const files = fs.readdirSync(folder)
      .filter(f => f.toLowerCase().endsWith(".mp4"));

    console.log("📄 Found videos:", files);
    return files;

  } catch (err) {
    console.error("❌ Error listing videos:", err);
    return [];
  }
});

// -----------------------------------------------------

app.whenReady().then(createWindow);
