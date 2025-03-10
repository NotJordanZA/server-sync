import { exec } from "child_process";

export function runPowerShell(command) {
  console.log("Executing:", command);
  return new Promise((resolve, reject) => {
    // Increase maxBuffer if you expect a lot of output
    exec(command, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        console.error("Execution error:", error);
        console.error("Stdout:", stdout);
        console.error("Stderr:", stderr);
        reject(`Error: ${error.message}\nStdout: ${stdout}\nStderr: ${stderr}`);
        return;
      }
      if (stderr) {
        console.error("Stderr detected:", stderr);
        reject(`Stderr: ${stderr}\nStdout: ${stdout}`);
        return;
      }
      resolve(stdout);
    });
  });
}
