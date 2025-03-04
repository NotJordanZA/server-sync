const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  runPowerShell: (command) => ipcRenderer.send("run-powershell", command),
  onPowerShellOutput: (callback) => ipcRenderer.on("powershell-output", (event, data) => callback(data)),
});