import { constructPowershellCommand, constructRunSyncCommand } from "./createPowershellCommand.js";
import { runPowerShell } from "./powershellRunner.js";
import path from 'path';
import { fileURLToPath } from "url";
import 'dotenv/config'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function syncProfiles(profiles, callback) {
  const commandList = [];
  for (const profile of profiles) {
    // commandList.push(await constructPowershellCommand(profile, true));
    commandList.push(await constructRunSyncCommand(profile, true));
  }

  const psDBScriptPath = path.join(__dirname, "../scripts", "writeResultsToDB.ps1");
  let DBCommand = "";
  for (const command of commandList) {
    // console.log(command);
    const profileName = extractProfileName(command);
    try {
      const output = await runPowerShell(command);
      callback(`${profileName}\nSuccess:\n${output}`);
      DBCommand = `pwsh.exe -ExecutionPolicy Bypass -File "${psDBScriptPath}" -dbURL "${process.env.SQL_API_ADDRESS}" -profileName "${profileName}" -result "Synced Successfully"`; 
    } catch (err) {
      callback(`${profileName}\nError:\n${err}`);
      DBCommand = `pwsh.exe -ExecutionPolicy Bypass -File "${psDBScriptPath}" -dbURL "${process.env.SQL_API_ADDRESS}" -profileName "${profileName}" -result "Sync Failed"`; 
    }
    await runPowerShell(DBCommand);
  }
}

function extractProfileName(fullCommand) {
  const regex = /-profileName\s+"([^"]+)"/;
  const match = fullCommand.match(regex);
  return match ? match[1] : null;
}
