const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Mirrors the same voice map that was in tts.py
const VOICE_MAP = {
    'angelo ph':   'fil-PH-AngeloNeural',
    'danica ph':   'fil-PH-DanicaNeural',
    'james ph':    'fil-PH-JamesNeural',
    'raphael ph':  'fil-PH-RaphaelNeural',
    'aria us':     'en-US-AriaNeural',
    'guy us':      'en-US-GuyNeural',
    'alloy us':    'en-US-AlloyNeural',
    'nanami jp':   'ja-JP-NanamiNeural',
    'keita jp':    'ja-JP-KeitaNeural',
    'haruka jp':   'ja-JP-HarukaNeural',
    'mai jp':      'ja-JP-MaiNeural',
    'ichiro jp':   'ja-JP-IchiroNeural',
    'japanese jp': 'ja-JP-NanamiNeural',
    'jp':          'ja-JP-NanamiNeural',
};

const DEFAULT_VOICE = 'fil-PH-AngeloNeural';

/**
 * Generate a TTS MP3 file using Microsoft Edge TTS (no Python required).
 * @param {string} text       - Text to speak.
 * @param {string|null} voice - Friendly voice name (e.g. "angelo ph"). Falls back to default.
 * @param {string} rate       - Speaking rate as SSML prosody value (e.g. "-10%").
 * @returns {Promise<string>} - Resolves with the absolute path to the generated MP3.
 */
async function generateTTS(text, voice = null, rate = '-10%', guildId = 'global') {
    const voiceKey = (voice || '').toLowerCase().trim();
    const voiceName = VOICE_MAP[voiceKey] || DEFAULT_VOICE;

    const fileName = `tts_${guildId}_${Date.now()}_${Math.floor(Math.random() * 1000)}.mp3`;
    const filePath = path.join(__dirname, fileName);

    const tts = new MsEdgeTTS();
    await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

    const { audioStream } = await tts.toStream(escapeXml(text), { rate });

    await new Promise((resolve, reject) => {
        const writable = fs.createWriteStream(filePath);
        audioStream.pipe(writable);
        writable.on('finish', resolve);
        writable.on('error', reject);
        audioStream.on('error', reject);
    });

    return filePath;
}

function escapeXml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

module.exports = generateTTS;