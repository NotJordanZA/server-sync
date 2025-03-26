import fs from 'fs';
import { encrypt } from './cryptoUtil.js';

export function saveConnectionProfile(profile) {
  const profilesDir = './connectionProfiles';
  if (!fs.existsSync(profilesDir)) {
    fs.mkdirSync(profilesDir, { recursive: true });
  }

  const profileData = {
    host: profile.host,
    username: profile.username,
    password: encrypt(profile.password)
  };

  // console.log(`${profilesDir}/${profile.username}@${profile.host}.json`);

  fs.writeFileSync(`${profilesDir}/${profile.username}@${profile.host}.json`, JSON.stringify(profileData, null, 2));
}