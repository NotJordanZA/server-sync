import { constructPowershellCommand } from "./createPowershellCommand.js";
import { runPowerShell } from "./powershellRunner.js";

export async function syncProfiles(profiles, callback) {
  const commandList = [];
  for (const profile of profiles) {
    commandList.push(await constructPowershellCommand(profile, true));
  }

  for (const command of commandList) {
    // console.log(command);
    const profileName = extractProfileName(command);
    try {
      const output = await runPowerShell(command);
      callback(`${profileName}\nSuccess:\n${output}`);
    } catch (err) {
      callback(`${profileName}\nError:\n${err}`);
    }
  }
}

function extractProfileName(fullCommand) {
  const regex = /-profileName\s+"([^"]+)"/;
  const match = fullCommand.match(regex);
  return match ? match[1] : null;
}
