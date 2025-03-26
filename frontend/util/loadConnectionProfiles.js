import fs from 'fs';
import path from 'path';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function loadConnectionProfiles() {
    const profilesDir = path.join(__dirname, "../connectionProfiles");
      let profiles = [];
      if (fs.existsSync(profilesDir)) {
        const files = fs.readdirSync(profilesDir);
        profiles = files.map(file => {
          const filePath = path.join(profilesDir, file);
          try {
            const data = fs.readFileSync(filePath, "utf8");
            return JSON.parse(data);
          } catch (err) {
            console.error(`Error reading profile ${file}:`, err);
            return null;
          }
        }).filter(profile => profile !== null);
      }
    return profiles;
}