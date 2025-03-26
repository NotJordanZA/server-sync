import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { exec } from "child_process";
import path from "path";
import { runPowerShell } from "./util/powershellRunner.js";
import { saveProfile } from "./util/saveProfile.js";
import { loadProfileWithPath, loadProfiles } from "./util/loadProfile.js";
import { deleteProfile } from "./util/deleteProfile.js";
import { createBatchFilesBySchedule } from "./util/updateScheduleBatchFiles.js";
import { updateProfile } from "./util/updateProfile.js";
import { syncProfiles } from "./util/syncProfiles.js";
import { extractLastSync } from "./util/extractLastSync.js";
import { loadConnectionProfiles } from "./util/loadConnectionProfiles.js";
import { saveConnectionProfile } from "./util/saveConnectionProfile.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let profileWindow;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 260,
    height: 480,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.loadFile("index.html");

  ipcMain.on("open-profile", () => {
    if (!profileWindow) {
      profileWindow = new BrowserWindow({
        width: 451,
        height: 440,
        parent: mainWindow, // Makes it a child window
        modal: true, // Blocks interaction with mainWindow when open
        autoHideMenuBar: true,
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

ipcMain.on('close-profile', () => {
  if (profileWindow) {
      profileWindow.close();
      profileWindow = null;
      if (mainWindow) {
        mainWindow.webContents.reload();
      }
  }
});

// Open profile update page
ipcMain.on("open-update-profile", async(event, profileName) => {
  if (!profileWindow) {
    profileWindow = new BrowserWindow({
      width: 451,
      height: 500,
      parent: mainWindow, // Makes it a child window
      modal: true, // Blocks interaction with mainWindow when open
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: true,
      },
    });

    const config = {
      name: profileName,
      profileJSON: await loadProfileWithPath(path.join(__dirname, `/syncProfiles/${profileName}.txt`))
    };

    profileWindow.loadFile("./pages/newProfile.html").then(() => {
      profileWindow.setTitle("Update Profile");
    });
    

    profileWindow.webContents.send('update-profile-contents', config);

    profileWindow.on("closed", () => {
      profileWindow = null;
    });
  }
});

// Message dialogue box
ipcMain.handle("show-message", async (event, { type, title, message }) => {
  await dialog.showMessageBox(mainWindow, {
      type, 
      title,
      message,
      buttons: ["OK"]
  });
});

// Delete message dialogue box
ipcMain.handle("show-delete-message", async (event, {message}) => {
  const response = await dialog.showMessageBox(mainWindow, {
      type:"warning", 
      title:"Server Sync",
      message,
      buttons: ["Yes", "Cancel"]
  });
  return response;
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

// Handle profile update
ipcMain.on("update-profile", (event, profileName, originalName, config) => {
  updateProfile(profileName, originalName, config, (output) => {
    event.reply("update-profile-output", output);
  });
});

// Handle profile delete
ipcMain.on("delete-profile", (event, profileName) => {
  deleteProfile(profileName, (output) => {
    event.reply("delete-profile-output", output);
  });
  if (mainWindow) {
    mainWindow.webContents.reload();
  }
});

// Handle profiles load
ipcMain.handle("get-profiles", async () => {
  const profiles = await loadProfiles();
  return profiles;
});

// Handle profiles sync
ipcMain.on("sync-profiles", async (event, profiles) => {
  await syncProfiles(profiles, (output) => {
    event.reply("sync-progress", output);
  });
  event.reply("sync-complete");
});

// Handle get last-sync
ipcMain.handle("get-last-sync", (event, profile) =>{
  return extractLastSync(profile);
});

// Handle loading connection profiles
ipcMain.handle("get-connection-profiles", async () => {
  const profiles = loadConnectionProfiles();
  return profiles;
})

// Handle saving new connection profile
ipcMain.on("save-connection-profile", (event, profile) => {
  saveConnectionProfile(profile);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});