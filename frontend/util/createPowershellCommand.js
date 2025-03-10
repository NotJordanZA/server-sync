import { loadProfileWithPath } from "./loadProfile.js";
import path from 'path';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function constructPowershellCommand(profileName){
    const psScriptPath = path.join(__dirname, "../scripts", "multithreadedsync.ps1");
    const baseCommand = `powershell.exe -ExecutionPolicy Bypass -File "${psScriptPath}"`;
    const profile = await loadProfileWithPath(`./syncProfiles/${profileName}.txt`);

    const sessionUrl = `-sessionUrl "${profile.sessionUrl}"`;
    const remotePath = `-remotePath "${profile.remotePath}"`;
    const localPath = `-localPath "${profile.localPath}"`;
    const logPath = `-logPath "${profile.logPath}"`;
    const connections = `-connections ${profile.connections}`;

    const fileRetention = profile.retentionYears? `>${profile.retentionYears}Y`:"";
    const exlcudedFiles = profile.fileMask? profile.fileMask:"";
    const fileMask = `-fileMask "${fileRetention}|${exlcudedFiles}"`;

    const commandArguments = `${sessionUrl} ${remotePath} ${localPath} ${logPath} ${fileMask} ${connections}`;
  
    const fullCommand = `${baseCommand} ${commandArguments}`;
    return fullCommand;
}