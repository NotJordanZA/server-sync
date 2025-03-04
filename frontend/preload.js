const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  runPowerShell: (command) => ipcRenderer.send("run-powershell", command),
  onPowerShellOutput: (callback) => ipcRenderer.on("powershell-output", (event, data) => callback(data)),
  openNewProfile: () => ipcRenderer.send("open-profile"),
  saveProfile: (name, config) => ipcRenderer.send("save-profile", name, config),
  onPowerShellOutput: (callback) => ipcRenderer.on("save-profile-output", (event, data) => callback(data)),
});