const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const { exec } = require("child_process");
const path = require("path");
const { runPowerShell } = require("./util/powershellRunner");
const {saveProfile} = require("./util/saveProfile");
const {loadProfileWithPath, loadProfiles} = require("./util/loadProfile");
const {deleteProfile} = require("./util/deleteProfile");
const {createBatchFilesBySchedule} = require("./util/updateScheduleBatchFiles");
const { updateProfile } = require("./util/updateProfile");
const { syncProfiles } = require("./util/syncProfiles");

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
      width: 500,
      height: 400,
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
ipcMain.on("sync-profiles", (event, profiles) =>{
  // console.log(profiles);
  syncProfiles(profiles);
  // console.log("Called");
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});