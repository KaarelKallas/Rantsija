const fs = require("fs");
const path = require("path");
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
    getKmlPath: () => ipcRenderer.invoke("get-kml-path"),
    readKmlFile: (fileName) => {
        try {
            const base = "C:\\rantsija";
            const full = path.join(base, fileName);
            return fs.readFileSync(full, "utf8");
        } catch (err) {
            console.error("Failed to read KML:", err);
            return null;
        }
    },
    getVideoBasePath: () => ipcRenderer.invoke("get-video-path"),
    listVideos: () => ipcRenderer.invoke("list-videos"),
});
