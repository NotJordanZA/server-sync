import fs from 'fs';
import path from 'path';
import { fileURLToPath } from "url";
import { constructPowershellCommand } from './createPowershellCommand.js';
import 'dotenv/config'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Groups profiles by schedule and creates/updates a batch file for each group.
 * Also registers a Windows scheduled task for each unique schedule.
 * If a batch file exists for a schedule that no longer has any profiles, that file is cleared.
 *
 * @param {Array} profiles - Array of profile objects.
 */
export function createBatchFilesBySchedule(profiles) {
  // Create a folder for schedule batch files if it doesn't exist.
  const scheduleDir = path.join(__dirname, "../schedules");
  if (!fs.existsSync(scheduleDir)) {
    fs.mkdirSync(scheduleDir, { recursive: true });
  }

  // Group profiles by schedule key.
  const scheduleGroups = {};
  profiles.forEach(profile => {
    const schedule = profile.profileJSON.schedule;
    // If there is no schedule, the type is 'never', or schedule is an empty object, skip grouping.
    if (!schedule || schedule.type === "never" || Object.keys(schedule).length === 0) return;

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

  // For each schedule group that exists, build/update the batch file and register a scheduled task.
  Object.keys(scheduleGroups).forEach(async safeKey => {
    const profilesInGroup = scheduleGroups[safeKey];
    const batchFilePath = path.join(scheduleDir, `${safeKey}.bat`);
    let contents = `@echo off\r\n`;
    const psDateScriptPath = path.join(__dirname, "../scripts", "writeDateToLog.ps1");
    const scheduleLogPath = path.join(__dirname, "../scheduleLogs", `${safeKey}_log.txt`);
    const dateLogCommand = `pwsh.exe -ExecutionPolicy Bypass -File "${psDateScriptPath}" -scheduleLogPath "${scheduleLogPath}"`;
    contents += `::logDate\r\n${dateLogCommand}\r\n`;

    for (const profile of profilesInGroup) {
      const command = await constructPowershellCommand(profile.name);
      contents += `::${profile.name}\r\n`;
      contents += `${command}\r\n`;
    }

    const psEmailScriptPath = path.join(__dirname, "../scripts", "sendEmails.ps1");
    const emailSubject = constructEmailSubject(safeKey);
    const emailCommand = `pwsh.exe -ExecutionPolicy Bypass -File "${psEmailScriptPath}" -scheduleLogPath "${scheduleLogPath}" -MailgunApiKey "${process.env.MAILGUN_API_KEY}" -MailgunDomain "${process.env.MAILGUN_DOMAIN}" -MailgunFromAddress "${process.env.MAILGUN_ADDRESS}" -EmailSubject "${emailSubject}"`;
    contents += `::Email Script\r\n`;
    contents += `${emailCommand}\r\n`;

    fs.writeFile(batchFilePath, contents, function (err) {
      if (err) {
        console.log(`Error: ${err}`);
      } else {
        console.log(`Batch file created/updated: ${batchFilePath}`);
      }
    });

    // Determine the scheduling parameters based on the safeKey.
    const parts = safeKey.split('_'); // e.g., ["daily", "20-00"] or ["weekly", "Monday", "20-00"]
    let schType = "";
    let startTime = "";
    let additionalParams = "";
    const taskName = `BackupTask_${safeKey}`;

    if (parts[0] === "daily") {
      schType = "DAILY";
      startTime = parts[1].replace('-', ':'); // Convert back to colon for schtasks
    } else if (parts[0] === "weekly") {
      schType = "WEEKLY";
      const day = parts[1].substring(0, 3).toUpperCase();
      startTime = parts[2].replace('-', ':');
      additionalParams = `/d ${day}`;
    } else if (parts[0] === "monthly") {
      schType = "MONTHLY";
      startTime = parts[2].replace('-', ':');
      additionalParams = `/d ${parts[1]}`;
    } else if (parts[0] === "yearly") {
      schType = "YEARLY";
      // For yearly, assume dateTime is in ISO format but with hyphens in place of colons.
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
    // exec(schtasksCmd, (error, stdout, stderr) => {
    //   if (error) {
    //     console.error(`Error scheduling task for ${safeKey}:`, error);
    //   } else {
    //     console.log(`Scheduled task "${taskName}" updated:`, stdout);
    //   }
    // });
  });

  // Clear out batch files in the schedules folder that are no longer needed
  const existingBatchFiles = fs.readdirSync(scheduleDir).filter(file => file.endsWith('.bat'));
  const currentKeys = new Set(Object.keys(scheduleGroups));
  existingBatchFiles.forEach(file => {
    const key = file.replace('.bat', '');
    if (!currentKeys.has(key)) {
      // Overwrite the file with just the header.
      const batchFilePath = path.join(scheduleDir, file);
      fs.writeFileSync(batchFilePath, '@echo off\r\n');
      console.log(`Batch file cleared: ${batchFilePath}`);
    }
  });
}

function capitalizeFirstLetter(val) {
  return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

function constructEmailSubject(key) {
  let subject = key.replaceAll("_", " ");
  // subject.replaceAll("-", "/");
  subject = capitalizeFirstLetter(subject);
  subject = setCharAt(subject, subject.length - 3, ':');
  return subject + " Sync Results"
}

function setCharAt(str,index,chr) {
  if(index > str.length-1) return str;
  return str.substring(0,index) + chr + str.substring(index+1);
}
