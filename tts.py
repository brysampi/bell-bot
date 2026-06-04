import edge_tts
import sys
import asyncio

# Get text from Node.js argument
text = sys.argv[1] if len(sys.argv) > 1 else ""
# Voice selection map: friendly names -> edge-tts voice IDs
VOICE_MAP = {
    "angelo ph": "fil-PH-AngeloNeural",
    "danica ph": "fil-PH-DanicaNeural",
    "james ph": "fil-PH-JamesNeural",
    "raphael ph": "fil-PH-RaphaelNeural",
    "aria us": "en-US-AriaNeural",
    "guy us": "en-US-GuyNeural",
    "alloy us": "en-US-AlloyNeural",
    "nanami jp": "ja-JP-NanamiNeural",
    "keita jp": "ja-JP-KeitaNeural",
    "haruka jp": "ja-JP-HarukaNeural",
    "mai jp": "ja-JP-MaiNeural",
    "ichiro jp": "ja-JP-IchiroNeural",
    "japanese jp": "ja-JP-NanamiNeural",
    "jp": "ja-JP-NanamiNeural"
}

# Voice selection logic
voice_arg = sys.argv[3].lower() if len(sys.argv) > 3 else "angelo ph"
if voice_arg in VOICE_MAP:
    voice = VOICE_MAP[voice_arg]
elif voice_arg in VOICE_MAP.values(): # Allow direct edge-tts IDs
    voice = voice_arg
else:
    voice = VOICE_MAP['angelo ph'] # Default voice if not found

# Output file path from Node.js argument
output = sys.argv[2] if len(sys.argv) > 2 else "tts.mp3"

# Speaking rate (speed) argument from Node.js
rate = sys.argv[4] if len(sys.argv) > 4 else "+0%"

async def main():
    communicate = edge_tts.Communicate(text, voice, rate=rate)
    await communicate.save(output)

# Run async function
asyncio.run(main())