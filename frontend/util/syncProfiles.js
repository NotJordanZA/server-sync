import { constructPowershellCommand } from "./createPowershellCommand.js";
import { runPowerShell } from "./powershellRunner.js";

export async function syncProfiles(profiles) {
  const commandList = [];
  for (const profile of profiles) {
    commandList.push(await constructPowershellCommand(profile));
  }

  for (const command of commandList) {
    try {
      const output = await runPowerShell(command);
      console.log("Command output:", output);
    } catch (err) {
      console.error("Command failed:", err);
    }
  }
}
