import edge_tts
import sys
import asyncio

# Get text from Node.js argument
text = sys.argv[1]

# Voice selection map: friendly names -> edge-tts voice IDs
VOICE_MAP = {
    "angelo PH": "fil-PH-AngeloNeural",
    "danica PH": "fil-PH-DanicaNeural",
    "james PH": "fil-PH-JamesNeural",
    "raphael PH": "fil-PH-RaphaelNeural",
    "aria US": "en-US-AriaNeural",
    "guy US": "en-US-GuyNeural",
    "alloy US": "en-US-AlloyNeural",
    "nanami JP": "ja-JP-NanamiNeural",
    "keita JP": "ja-JP-KeitaNeural",
    "haruka JP": "ja-JP-HarukaNeural",
    "mai JP": "ja-JP-MaiNeural",
    "ichiro JP": "ja-JP-IchiroNeural",
    "japanese JP": "ja-JP-NanamiNeural",
    "jp": "ja-JP-NanamiNeural"
}

# voice_arg = sys.argv[2].lower() if len(sys.argv) > 2 else "angelo"
# if voice_arg in VOICE_MAP:
#     voice = VOICE_MAP[voice_arg]
# elif voice_arg in VOICE_MAP.values():
#     voice = voice_arg
# else:
#     print(f"Unsupported voice: {voice_arg}", file=sys.stderr)
#     print("Supported voices:", ", ".join(sorted(VOICE_MAP.keys())), file=sys.stderr)
#     sys.exit(1)

voice = VOICE_MAP['angelo PH'] # Default voice
# Output file name
output = "tts.mp3"

async def main():
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output)

# Run async function
asyncio.run(main())