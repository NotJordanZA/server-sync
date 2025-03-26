import 'dotenv/config';
import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { decrypt } from './cryptoUtil.js';
import { runPowerShell } from './powershellRunner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadConnectionProfile(profileName) {
  const profilePath = path.join(__dirname, '../connectionProfiles', `${profileName}.json`);
  if (!fs.existsSync(profilePath)) {
    throw new Error(`Connection profile ${profileName} not found.`);
  }

  const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
  profile.password = decrypt(profile.password);
  return profile;
}

function constructSessionUrl({ username, password, host }) {
  return `ftp://${username}:${password}@${host}`;
}

// Parse command line arguments
const args = process.argv.slice(2);
const argObj = {};
for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace(/^-+/, '');
  argObj[key] = args[i + 1];
}

if (!argObj.connectionProfile || !argObj.profileName || !argObj.remotePath || !argObj.localPath) {
  console.error('Usage: node runSync.js --connectionProfile <profile> --profileName <syncProfile> --remotePath <remotePathDirectory> --localPath <localPathDirectory> [other params...]');
  process.exit(1);
}

try {
  // Load and decrypt the connection profile.
  const connectionProfile = loadConnectionProfile(argObj.connectionProfile);
  const sessionUrl = constructSessionUrl(connectionProfile);

  const scriptPath = path.join(__dirname, '../scripts', 'multithreadedsync.ps1');
  
  const fileMask = argObj.fileMask || '|';
  const psArgs = [
    '-profileName', `"${argObj.profileName}"`,
    '-sessionUrl', `"${sessionUrl}"`,
    '-remotePath', `"${argObj.remotePath}"` || '/test/',
    '-localPath', `"${argObj.localPath}"` || 'C:\\path\\to\\local',
    '-logPath', `"${argObj.logPath}"` || 'C:\\path\\to\\log.log',
    '-internalLogPath', `"${argObj.internalLogPath}"` || 'C:\\path\\to\\internal_log.txt',
    '-scheduleLogPath', `"${argObj.scheduleLogPath}"` || 'C:\\path\\to\\schedule_log.txt',
    '-fileMask', `"${fileMask}"`,
    '-connections', `"${argObj.connections}"` || '4',
    '-email', `"${argObj.email}"` || 'undefined'
  ];

  let command = `pwsh.exe -ExecutionPolicy Bypass -File "${scriptPath}" `;

  for(var i = 0; i < psArgs.length; i+=2){
    command += psArgs[i] + " " + psArgs[i+1] + " ";
  }
  // for(var arg in psArgs){
  //   command += arg + " ";
  // }
  runPowerShell(command);
  // Launch the PowerShell sync script.
  // execFile('pwsh.exe', ['-ExecutionPolicy', 'Bypass', '-File', `"${scriptPath}"`, ...psArgs], (error, stdout, stderr) => {
  //   if (error) {
  //     console.error('Error executing PowerShell script:', error);
  //     process.exit(1);
  //   }
  //   console.log(stdout);
  //   if (stderr) {
  //     console.error(stderr);
  //   }
  // });
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
