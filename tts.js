const { execFile } = require("child_process");

function generateTTS(text, voice = null) {
  return new Promise((resolve, reject) => {
    const args = ["tts.py", text];
    if (voice) args.push(voice);

    execFile("python", args, { windowsHide: true }, (err, stdout, stderr) => {
      if (err) {
        console.error("TTS generation error:", err);
        console.error("TTS script stderr:", stderr);
        return reject(new Error(stderr || err.message));
      }
      resolve("./tts.mp3");
    });
  });
}

module.exports = generateTTS;