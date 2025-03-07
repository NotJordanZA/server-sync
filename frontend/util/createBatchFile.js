import { fileURLToPath } from "url";
import fs from 'fs';
import { join } from "path";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createBatchFile(profiles){
    const psScriptPath = join(__dirname, "scripts/multithreadedsync.ps1");
    const commandNoArgs = `powershell.exe -ExecutionPolicy Bypass -File "${psScriptPath}"`;
    var contents = `@echo off\r\n`;

    for(const profile of profiles){
        const sessionUrl = `-sessionUrl "${profile.profileJSON.sessionUrl}"`;
        const remotePath = `-remotePath "${profile.profileJSON.remotePath}"`;
        const localPath = `-localPath "${profile.profileJSON.localPath}"`;
        const logPath = `-logPath "${profile.profileJSON.logPath}"`;
        const connections = `-connections ${profile.profileJSON.connections}`;
        const command = `${sessionUrl} ${remotePath} ${localPath} ${logPath} ${connections}`;
        const name = profile.name;

        contents += `::${name}\r\n ${commandNoArgs} ${command}\r\n`;
    }
    fs.writeFile(`./scripts/powershellRunner.bat`, contents, function (err) {
        if (err){
            // callback(`Error: ${err}`);
        }else{
            // callback(`Batch file created Successfully`);
        }
    });
}