const { app, BrowserWindow, ipcMain } = require("electron");
const { exec } = require("child_process");
const path = require("path");
const { runPowerShell } = require("./util/powershellRunner");
const {saveProfile} = require("./util/saveProfile");

let mainWindow;
let profileWindow;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 500,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.loadFile("index.html");

  ipcMain.on("open-profile", () => {
    if (!profileWindow) {
      profileWindow = new BrowserWindow({
        width: 500,
        height: 400,
        parent: mainWindow, // Makes it a child window
        modal: true, // Blocks interaction with mainWindow when open
        webPreferences: {
          preload: path.join(__dirname, "preload.js"),
          contextIsolation: true,
        },
      });

      profileWindow.loadFile("./pages/newProfile.html");

      profileWindow.on("closed", () => {
        profileWindow = null;
      });
    }
  });
});

// Handle PowerShell execution from frontend
ipcMain.on("run-powershell", (event, command) => {
  runPowerShell(command, (output) => {
    event.reply("powershell-output", output);
  });
});
// Handle profile save
ipcMain.on("save-profile", (event, profileName, config) => {
  saveProfile(profileName, config, (output) => {
    event.reply("save-profile-output", output);
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
