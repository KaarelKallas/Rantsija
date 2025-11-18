// main.cjs
const { BrowserWindow, app } = require("electron");
const path = require("path");
ipcMain.handle("get-video-folder", () => {
    // Handles both installed app and portable modes
    const exeDir = process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(app.getPath("exe"));
    return path.join(exeDir, "videos");
  });
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.loadURL("http://localhost:5173"); // or your production index.html
}

app.whenReady().then(createWindow);
