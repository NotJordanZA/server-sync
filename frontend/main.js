const { app, BrowserWindow, ipcMain } = require("electron");
const { exec } = require("child_process");
const path = require("path");

let mainWindow;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 500,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      // contextIsolation: false, // Needed for simplicity
    },
  });

  mainWindow.loadFile("index.html");
});

// Handle PowerShell execution from frontend
ipcMain.on("run-powershell", (event, command) => {
  const psScriptPath = path.join(__dirname, "scripts/multithreadedsync.ps1");
  const fullCommand = `powershell.exe -ExecutionPolicy Bypass -File "${psScriptPath}" ${command}`;

  console.log("Executing:", fullCommand);

  exec(fullCommand, (error, stdout, stderr) => {
    if (error) {
      event.reply("powershell-output", `Error: ${error.message}`);
      return;
    }
    if (stderr) {
      event.reply("powershell-output", `Stderr: ${stderr}`);
      return;
    }
    event.reply("powershell-output", stdout);
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
