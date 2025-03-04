import { exec } from "child_process";
import { join } from "path";

/**
 * Executes a PowerShell script with given arguments.
 * @param {string} command - The arguments to pass to the PowerShell script.
 * @param {function} callback - A callback function to handle output or errors.
 */
function runPowerShell(command, callback) {
  const psScriptPath = join(__dirname, "scripts/multithreadedsync.ps1");
  const fullCommand = `powershell.exe -ExecutionPolicy Bypass -File "${psScriptPath}" ${command}`;

  console.log("Executing:", fullCommand);

  exec(fullCommand, (error, stdout, stderr) => {
    if (error) {
      callback(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      callback(`Stderr: ${stderr}`);
      return;
    }
    callback(stdout);
  });
}

export default { runPowerShell };
