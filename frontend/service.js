// service.js
import { Service, EventLogger } from 'node-windows';
import schedule from 'node-schedule';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from "url";

var log = new EventLogger('MySyncService');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directory where the batch files are stored.
const schedulesDir = path.join(__dirname, 'schedules');
// A map to track scheduled jobs so we can clear and update them.
const scheduledJobs = new Map();

let reloadTimeout = null;

/**
 * Load batch files from the schedules directory and schedule them using node-schedule.
 */
function loadBatchFilesAndSchedule() {
  // Cancel any existing jobs.
  for (const [file, job] of scheduledJobs) {
    job.cancel();
  }
  scheduledJobs.clear();

  fs.readdir(schedulesDir, (err, files) => {
    if (err) {
      console.error('Error reading schedules directory:', err);
      log.error('Error reading schedules directory:', err);
      return;
    }

    // Process each .bat file.
    files.filter(file => file.endsWith('.bat')).forEach(file => {
        const filePath = path.join(schedulesDir, file);
        const safeKey = file.replace('.bat', '');
        const parts = safeKey.split('_');
        let rule;
      
        if (parts[0] === 'daily') {
          // Expected format: daily_HH-MM.bat
          const timeParts = parts[1].split('-');
          rule = new schedule.RecurrenceRule();
          rule.hour = parseInt(timeParts[0], 10);
          rule.minute = parseInt(timeParts[1], 10);
        } else if (parts[0] === 'weekly') {
          // Expected format: weekly_Day_HH-MM.bat (e.g., weekly_Monday_11-00.bat)
          const timeParts = parts[2].split('-');
          rule = new schedule.RecurrenceRule();
          const dayMap = {
            Sunday: 0,
            Monday: 1,
            Tuesday: 2,
            Wednesday: 3,
            Thursday: 4,
            Friday: 5,
            Saturday: 6,
          };
          rule.dayOfWeek = dayMap[parts[1]];
          rule.hour = parseInt(timeParts[0], 10);
          rule.minute = parseInt(timeParts[1], 10);
        } else if (parts[0] === 'monthly') {
          // Expected format: monthly_Day_HH-MM.bat (e.g., monthly_25_11-00.bat)
          const dayOfMonth = parseInt(parts[1], 10);
          const timeParts = parts[2].split('-');
          rule = new schedule.RecurrenceRule();
          rule.date = dayOfMonth;  // Day of month (1-31)
          rule.hour = parseInt(timeParts[0], 10);
          rule.minute = parseInt(timeParts[1], 10);
        } else if (parts[0] === 'yearly') {
          // Expected format: yearly_YYYY-MM-DDT HH-MM.bat (e.g., yearly_2025-03-12T15-11.bat)
          // Convert the parts into a proper Date.
          // First, replace the "T" with a space, then convert the hyphen in the time to a colon.
          // This example assumes parts[1] is like "2025-03-12T15-11"
          let dateTimeString = parts[1];
          if (dateTimeString.indexOf('T') === -1) {
            console.warn(`Yearly schedule format incorrect in ${file}`);
            log.warn(`Yearly schedule format incorrect in ${file}`);
            return;
          }
          // Replace the hyphen in the time portion with a colon.
          dateTimeString = dateTimeString.replace('T', ' ');
          // Replace the first hyphen in the time portion (if any) with a colon.
          // (This simple replace assumes the date part is standard YYYY-MM-DD.)
          dateTimeString = dateTimeString.replace(/(\d{2})-(\d{2})$/, '$1:$2');
      
          const dt = new Date(dateTimeString);
          if (isNaN(dt)) {
            console.warn(`Failed to parse yearly schedule date from ${file}`);
            log.warn(`Failed to parse yearly schedule date from ${file}`);
            return;
          }
          rule = new schedule.RecurrenceRule();
          rule.month = dt.getMonth();   // 0-indexed month
          rule.date = dt.getDate();       // Day of month
          rule.hour = dt.getHours();
          rule.minute = dt.getMinutes();
        } else {
          console.warn(`Schedule type '${parts[0]}' not supported by the service scheduling.`);
          log.warn(`Schedule type '${parts[0]}' not supported by the service scheduling.`);
          return;
        }
      
        const job = schedule.scheduleJob(rule, () => {
          console.log(`[${new Date().toISOString()}] Executing batch file: ${filePath}`);
          log.info(`[${new Date().toISOString()}] Executing batch file: ${filePath}`);
          exec(`"${filePath}"`, (error, stdout, stderr) => {
            if (error) {
              const errMsg = `Error executing ${filePath}: ${error.message}`;
              console.error(errMsg);
              log.error(errMsg);
            }
            if (stdout) {
              const outMsg = `Output from ${filePath}: ${stdout}`;
              console.log(outMsg);
              log.info(outMsg);
            }
            if (stderr) {
              const errOutMsg = `Error output from ${filePath}: ${stderr}`;
              console.error(errOutMsg);
              log.error(errOutMsg);
            }
          });
        });
      
        scheduledJobs.set(file, job);
        console.log(`Scheduled job for ${file} with rule: ${JSON.stringify(rule)}`);
        log.info(`Scheduled job for ${file} with rule: ${JSON.stringify(rule)}`);
      });
  });
}

// Initial scheduling load.
loadBatchFilesAndSchedule();

// Optional: watch for changes in the schedules directory and reload jobs.
fs.watch(schedulesDir, (eventType, filename) => {
    if (filename && filename.endsWith('.bat')) {
      console.log(`Detected change in ${filename}, scheduling reload...`);
      log.info(`Detected change in ${filename}, scheduling reload...`);
      if (reloadTimeout) {
        clearTimeout(reloadTimeout);
      }
      reloadTimeout = setTimeout(() => {
        loadBatchFilesAndSchedule();
      }, 1000); // Adjust the delay as needed.
    }
  });

/*
 * Create a new Windows Service using node-windows.
 * When installed, this service will run this file continuously.
 */
const svc = new Service({
  name: 'MySyncService',
  description: 'Service for orchestrating sync tasks for the Server Sync application.',
  script: __filename, // This file.
});

// Event handlers for the service.
svc.on('install', () => {
  svc.start();
  console.log('Service installed and started.');
  log.info('Service installed and started.');
});

svc.on('start', () => {
  console.log('Service started.');
  log.info('Service started.');
});

svc.on('stop', () => {
  console.log('Service stopped.');
  log.info('Service stopped.');
});

// If run with command-line arguments to install/uninstall, handle them.
if (process.argv.includes('--install')) {
  svc.install();
} else if (process.argv.includes('--uninstall')) {
  svc.uninstall();
} else {
  console.log('Running as a service...');
  log.info('Running as a service...');
}
