const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs"); // Required for path.join

function generateTTS(text, voice = null, rate = "-10%") {
  return new Promise((resolve, reject) => {
    // Generate unique filename to prevent race conditions and overwriting
    const fileName = `tts_${Date.now()}_${Math.floor(Math.random() * 1000)}.mp3`;
    const filePath = path.join(__dirname, fileName);
    
    // Pass arguments: [text, filePath, voice, rate]
    const args = [text, filePath, voice || "angelo ph", rate];

    execFile("python", ["tts.py", ...args], { windowsHide: true, cwd: __dirname }, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(stderr || err.message));
      }
      resolve(filePath);
    });
  });
}

module.exports = generateTTS;