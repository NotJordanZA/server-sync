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
  openUpdateProfile: (name) => ipcRenderer.send("open-update-profile", name),
  updateProfile: (name, originalName, config) => ipcRenderer.send("update-profile", name, originalName, config),
  onUpdateProfileOutput: (callback) => ipcRenderer.on("update-profile-output", (event, data) => callback(data)),
  onUpdateProfilePageLoad: (callback) => ipcRenderer.on("update-profile-contents", (event, data) => callback(data)),
  onDeleteProfileOutput: (callback) => ipcRenderer.on("delete-profile-output", (event, data) => callback(data)),
  showMessage: (type, title, message) => ipcRenderer.invoke("show-message", { type, title, message }),
  syncProfiles: (profiles) => ipcRenderer.send("sync-profiles", profiles),
  showDeleteMessage: (message) => ipcRenderer.invoke("show-delete-message", { message }),
  onDeleteMessageResponse: (callback) => ipcRenderer.on("delete-message-response", (event, data) => callback(data)),
});