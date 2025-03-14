import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function extractLastSync(profile) {

    const filePath = path.join(__dirname, `../logs/${profile}_log.txt`);

    if (!fs.existsSync(filePath)) {
      return "Never";
    }
  
    const contents = fs.readFileSync(filePath, 'utf8');
    const lines = contents.split(/\r?\n/);
    let lastDate = "Never";

    for (let i = 0; i < lines.length - 1; i++) {
        if (lines[i].trim() === "Done") {
            const finishedLine = lines[i + 1].trim();
            if (finishedLine.startsWith("Finished: ")) {
                lastDate = finishedLine.substring("Finished: ".length).trim();
                const [datePart, timePart] = lastDate.split(' ');
                const [month, day, year] = datePart.split('/');
                const [hour, minute] = timePart.split(':');
                lastDate = `${year}/${month}/${day} ${hour}:${minute}`;
            }
        }
    }
  
    return lastDate;
  }