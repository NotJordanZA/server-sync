import { loadProfileWithPath } from "./loadProfile.js";
import path from 'path';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function constructPowershellCommand(profileName, syncNow = false){
    const psScriptPath = path.join(__dirname, "../scripts", "multithreadedsync.ps1");
    const baseCommand = `pwsh.exe -ExecutionPolicy Bypass -File "${psScriptPath}"`;
    const profile = await loadProfileWithPath(`./syncProfiles/${profileName}.txt`);

    const internalLogPath = path.join(__dirname, "../logs", `${profileName}_log.txt`);

    const pName = `-profileName "${profileName}"`;
    const sessionUrl = `-sessionUrl "${profile.sessionUrl}"`;
    const remotePath = `-remotePath "${profile.remotePath}"`;
    const localPath = `-localPath "${profile.localPath}"`;
    const logPath = `-logPath "${profile.logPath}"`;
    const internalLogPathArg = `-internalLogPath "${internalLogPath}"`;
    const connections = `-connections ${profile.connections}`;
    
    const email = `-email "${profile.email? profile.email:""}"`;
    const fileRetention = profile.retentionYears? `>${profile.retentionYears}Y`:"";
    const exlcudedFiles = profile.fileMask? profile.fileMask:"";
    const fileMask = `-fileMask "${fileRetention}|${exlcudedFiles}"`;
    var scheduleLogPathArg = `-scheduleLogPath " "`;

    if(profile.schedule.type !== "never" && !syncNow){
        let key = "";
        if (profile.schedule.type === "daily") {
            key = `daily_${profile.schedule.time}`;
        } else if (profile.schedule.type === "weekly") {
            key = `weekly_${profile.schedule.day}_${profile.schedule.time}`;
        } else if (profile.schedule.type === "monthly") {
            key = `monthly_${profile.schedule.day}_${profile.schedule.time}`;
        } else if (profile.schedule.type === "yearly") {
            key = `yearly_${profile.schedule.dateTime}`;
        }

        const safeKey = key.replace(/:/g, '-');
        const scheduleLogPath = path.join(__dirname, "../scheduleLogs", `${safeKey}_log.txt`);
        scheduleLogPathArg = `-scheduleLogPath "${scheduleLogPath}"`;
    }

    const commandArguments = `${pName} ${sessionUrl} ${remotePath} ${localPath} ${logPath} ${internalLogPathArg} ${scheduleLogPathArg} ${fileMask} ${connections} ${email}`;
  
    const fullCommand = `${baseCommand} ${commandArguments}`;
    return fullCommand;
}