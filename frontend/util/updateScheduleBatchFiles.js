import fs from 'fs';
import path from 'path';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createBatchFilesBySchedule(profiles) {
    // Create a folder for schedule batch files if it doesn't exist.
    const scheduleDir = path.join(__dirname, "../schedules");
    if (!fs.existsSync(scheduleDir)) {
      fs.mkdirSync(scheduleDir, { recursive: true });
    }
  
    // Group profiles by schedule key.
    const scheduleGroups = {};
    profiles.forEach(profile => {
      // If there is no schedule or the type is 'never', skip grouping.
      const schedule = profile.profileJSON.schedule;
      if (!schedule || schedule.type === "never" || schedule == {}) return;
  
      // Build a key based on schedule type and timing details.
      let key = "";
      if (schedule.type === "daily") {
        key = `daily_${schedule.time}`;
      } else if (schedule.type === "weekly") {
        key = `weekly_${schedule.day}_${schedule.time}`;
      } else if (schedule.type === "monthly") {
        key = `monthly_${schedule.day}_${schedule.time}`;
      } else if (schedule.type === "yearly") {
        key = `yearly_${schedule.dateTime}`;
      }
  
      // Replace colons with hyphens to create a safe file name and task name.
      const safeKey = key.replace(/:/g, '-');
  
      if (!scheduleGroups[safeKey]) {
        scheduleGroups[safeKey] = [];
      }
      scheduleGroups[safeKey].push(profile);
    });
  
    // For each unique schedule group, build the batch file and register a scheduled task.
    Object.keys(scheduleGroups).forEach(safeKey => {
      const profilesInGroup = scheduleGroups[safeKey];
      const batchFilePath = path.join(scheduleDir, `${safeKey}.bat`);
      let contents = `@echo off\r\n`;
  
      // Loop through each profile in the group and build its command.
      profilesInGroup.forEach(profile => {
        const sessionUrl = `-sessionUrl ${profile.profileJSON.sessionUrl}`;
        const remotePath = `-remotePath "${profile.profileJSON.remotePath}"`;
        const localPath = `-localPath "${profile.profileJSON.localPath}"`;
        const logPath = `-logPath "${profile.profileJSON.logPath}"`;
        const connections = `-connections ${profile.profileJSON.connections}`;
        const commandArgs = `${sessionUrl} ${remotePath} ${localPath} ${logPath} ${connections}`;
        
        contents += `::${profile.name}\r\n`;
        const psScriptPath = path.join(__dirname, "scripts", "multithreadedsync.ps1");
        const baseCommand = `powershell.exe -ExecutionPolicy Bypass -File "${psScriptPath}"`;
        contents += `${baseCommand} ${commandArgs}\r\n`;
      });
  
        fs.writeFile(batchFilePath, contents, function (err) {
        if (err){
            console.log(`Error: ${err}`);
        }else{
            console.log(`Batch file created Successfully`);
        }
        });
      console.log(`Batch file created/updated: ${batchFilePath}`);
  
      // Determine the scheduling parameters based on the safeKey.
      const parts = safeKey.split('_');
      let schType = "";
      let startTime = "";
      let additionalParams = "";
      const taskName = `BackupTask_${safeKey}`;
  
      if (parts[0] === "daily") {
        schType = "DAILY";
        startTime = parts[1].replace('-', ':'); // Convert back to colon for schtasks
      } else if (parts[0] === "weekly") {
        schType = "WEEKLY";
        // For schtasks, day needs to be in three-letter format.
        const day = parts[1].substring(0, 3).toUpperCase();
        startTime = parts[2].replace('-', ':');
        additionalParams = `/d ${day}`;
      } else if (parts[0] === "monthly") {
        schType = "MONTHLY";
        // parts[1] is day of month and parts[2] is time.
        startTime = parts[2].replace('-', ':');
        additionalParams = `/d ${parts[1]}`;
      } else if (parts[0] === "yearly") {
        schType = "YEARLY";
        // For yearly, we assume the dateTime is in ISO format but with hyphens in place of colons.
        // Parse the parts after "yearly" to reconstruct the date-time.
        const dateTimeStr = parts.slice(1).join('_').replace('-', ':');
        const dt = new Date(dateTimeStr);
        if (!isNaN(dt)) {
          startTime = `${dt.getHours().toString().padStart(2, '0')}:${dt.getMinutes().toString().padStart(2, '0')}`;
        }
      }
  
      // Build the schtasks command.
      let schtasksCmd = `schtasks /create /f /sc ${schType} /tn "${taskName}" /tr "${batchFilePath}"`;
      if (startTime) {
        schtasksCmd += ` /st ${startTime}`;
      }
      if (additionalParams) {
        schtasksCmd += ` ${additionalParams}`;
      }
  
      console.log(`Scheduled task "${taskName}" updated:`);
      // Execute the schtasks command to create/update the scheduled task.
    //   exec(schtasksCmd, (error, stdout, stderr) => {
    //     if (error) {
    //       console.error(`Error scheduling task for ${safeKey}:`, error);
    //     } else {
    //       console.log(`Scheduled task "${taskName}" updated:`, stdout);
    //     }
    //   });
    });
  }
