const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  runPowerShell: (command) => ipcRenderer.send("run-powershell", command),
  onPowerShellOutput: (callback) => ipcRenderer.on("powershell-output", (event, data) => callback(data)),
  openNewProfile: () => ipcRenderer.send("open-profile"),
  closeProfile: () => ipcRenderer.send("close-profile"),
  getProfiles: () => ipcRenderer.invoke("get-profiles"),
  saveProfile: (name, config) => ipcRenderer.send("save-profile", name, config),
  onSaveProfileOutput: (callback) => ipcRenderer.on("save-profile-output", (event, data) => callback(data)),
  deleteProfile: (name) => ipcRenderer.send("delete-profile", name),
  onDeleteProfileOutput: (callback) => ipcRenderer.on("delete-profile-output", (event, data) => callback(data)),
  showMessage: (type, title, message) => ipcRenderer.invoke("show-message", { type, title, message }),
});