# AI_CONTEXT

**Last Updated:** 2026-07-20  
**Repository Version:** v1.0.0 (from `package.json`)

---

## 1. Project Overview
- **Purpose:** Discord bot that provides text-to-speech (TTS) in voice channels, plus several utility slash commands.  
- **Business Domain:** Community/gaming Discord servers (Filipino-styled messages).  
- **Main Functionality:**
  - Auto-TTS of chat messages in configured channels.
  - On-demand TTS via `b!tts`/`tts` commands.
  - Voice channel join/leave control (`/jointts`, `/leavetts`).
  - Miscellaneous commands: invite code handling, role-based prompts, anonymous messages, spam mentions.
- **Development Stage:** Production-ready core features; auxiliary commands still experimental.

---

## 2. Technology Stack
| Layer | Details |
|------|---------|
| **Language** | JavaScript (Node v16+) using CommonJS modules |
| **Frameworks** | `discord.js` v14, `@discordjs/voice` |
| **Libraries** | `express`, `dotenv`, `ffmpeg-static`, `msedge-tts` (Microsoft Edge Neural TTS) |
| **Database** | *None* (in-memory maps) |
| **Authentication** | Discord bot token (`DISCORD_TOKEN`) via env variable |
| **Infrastructure** | Runs on any Node host; includes a tiny Express server on port 3000 |
| **Build Tools** | `npm` (script: `dev` -> `node index.js`) |
| **Package Manager** | npm |
| **Testing Framework** | *None* |
| **Deployment** | Deploy via any Node environment; slash commands registered by `deploy-commands.js` |

---

## 3. High-Level Architecture
- **Entry Point (`index.js`)** starts Express health server, loads env, creates Discord `Client`, sets up per-guild audio queue manager, listens for `messageCreate` (auto-TTS) and `interactionCreate` (slash commands).
- **TTS Generation (`tts.js`)** uses the `msedge-tts` library directly (pure Node.js) to call Microsoft Edge Read Aloud API.
- **Slash Command Registration (`deploy-commands.js`)** defines all commands with `SlashCommandBuilder` and registers them via Discord REST API.
- **Dependency Flow:** `index.js` -> `tts.js` -> `msedge-tts` -> MP3 file -> `@discordjs/voice` player.
- **Service Boundaries:** Discord service (all API interactions), Audio service (voice connections & playback), Web service (simple health endpoint).

---

## 4. Directory Guide
```
/ (project root)
│   index.js            – main bot runner, event handling
│   tts.js              – wrapper for Node.js edge-tts generation
│   deploy-commands.js  – slash-command definition & registration
│   package.json        – project metadata & deps
│   .env                – runtime secrets (DISCORD_TOKEN, CLIENT_ID)
│   test.js (placeholder) – future tests
│   node_modules/       – installed packages (ignored)
│   .git/               – VCS metadata (ignored)
```

---

## 5. Major Components
| Component | Purpose | Main Files | Key Dependencies | Related Modules |
|-----------|---------|------------|------------------|-----------------|
| **Bot Core** | Connects to Discord, handles events, manages voice queues | `index.js` | `discord.js`, `@discordjs/voice`, `express`, `dotenv` | `tts.js`, `audioQueues` |
| **TTS Engine** | Generates MP3 audio from text using Microsoft Edge Read Aloud API | `tts.js` | `msedge-tts` | Consumed by Bot Core |
| **Command Registry** | Declares and registers slash commands globally | `deploy-commands.js` | Discord REST, `SlashCommandBuilder` | Used once during deployment |
| **Audio Queue Manager** | Per-guild queue, player lifecycle, cleanup | Logic inside `index.js` (`getGuildQueue`, `playNext`, `playAudio`, `stopAndClearGuildAudio`) | `@discordjs/voice` player, `fs` for temp file removal | Interacts with TTS Engine |
| **Web Health Endpoint** | Simple HTTP GET to confirm bot is running | `index.js` (Express) | `express` | None |

---

## 6. Database Overview
- No persistent database.
- In-memory `Map`s store temporary state:
  - `audioQueues` – guild-ID -> `{ queue, player, currentFile, voiceConnection }`
  - `inviteData`, `inviteThreads`, `channelTTS`, `spamMention` – command-specific caches.

---

## 7. API Overview
### Slash Commands (registered via `deploy-commands.js`)
| Command | Options | Description |
|---------|---------|-------------|
| `kingina` | – | Simple placeholder text command. |
| `jointts` | `voice` (optional) | Bot joins voice channel, enables auto-TTS for the text channel. |
| `leavetts` | `voice` (optional) | Bot leaves voice channel, disables auto-TTS. |
| `invite` | `code` (required), `role` (required) | Stores an invite code linked to a role (logic currently commented out). |
| `pabuhat` | `mention` (user) | Sends a random “task” message tagging the mentioned user. |
| `pabuhatrole` | `role` (role), `code` (optional) | Sends a random role-play message, optionally includes a code. |
| `annonimous` | `annonimousmessage` (string), `user` (optional) | Sends an anonymous message, optionally mentions a user. |
| `spammention` | `spamuser` (user) | Sends a DM to the target user repeatedly (demo). |
| `tts` / `b!tts` (message prefix) | `<voice?> <text>` | Generates TTS for supplied text, joins voice channel. |

**Routing Flow** – Commands are globally registered; `index.js`’s `interactionCreate` listener dispatches based on `interaction.commandName`.

**Validation** – Arguments are validated by Discord’s option requirements and runtime checks (e.g., voice channel presence).

---

## 8. Authentication & Authorization
- **Auth Flow:** Bot token (`DISCORD_TOKEN`) loaded from `.env` -> `client.login()`.
- **Session:** Persistent while process runs; reconnection handled by `discord.js`.
- **Roles/Permissions:** No per-guild permission checks; all users can invoke commands.
- **Security Middleware:** None beyond token handling; keep `.env` out of repo.

---

## 9. Shared Utilities
- `audioQueues` Map – central state for per-guild audio handling.
- `SUPPORTED_VOICES` Set – whitelist of voice identifiers.
- `generateTTS` – async helper using `msedge-tts`.
- `channelTTS` Map – tracks which text channels have auto-TTS enabled and associated voice channel ID.

All defined in `index.js` and imported where needed.

---

## 10. Configuration
| File / Env Var | Meaning |
|----------------|---------|
| `.env` | `DISCORD_TOKEN`, `DISCORD_CLIENT_ID` (required for bot & command registration). |
| `process.env.FFMPEG_PATH` | Set automatically to `ffmpeg-static` binary path for voice processing. |
| `package.json` scripts | `"dev": "node index.js"` – start bot. |
| Feature Flags | None currently. |

**No secrets** are committed.

---

## 11. Coding Standards
- **Naming:** `camelCase` for variables/functions, `PascalCase` for classes (none used).
- **Folder Layout:** Flat root; all source files in project root.
- **Patterns:** Singleton `client`; per-guild map for state; async/await with try/catch; clean-up of temporary MP3s on player idle/error/exit.
- **Error Handling:** `console.error` with context.
- **Logging:** Simple console logs.
- **Validation:** Inline checks for required resources.
- **Formatting:** 2-space indentation, semicolons, trailing commas.
- **Architecture Principles:** Keep bot logic in `index.js`; delegate TTS generation to separate module.

---

## 12. Current Project Status
- **Completed:** Core bot connection, auto-TTS, on-demand TTS, basic slash commands, command registration.
- **In Progress:** Commented-out features (invite thread handling, role-based invites).
- **Planned:** Persistent storage for invites, comprehensive test suite, edge-case handling for rate limits, cleanup of stale MP3 files.
- **Deprecated/Removed:** Python integration (`tts.py` deleted), unused `ytdl-core-discord` dependency.

---

## 13. Known Issues
- **TODO/FIXME:** Commented code in `deploy-commands.js` for invite threads – unfinished.
- **Technical Debt:** Accumulation of temporary MP3 files if bot crashes before cleanup (partially mitigated by graceful exit listeners).
- **Potential Bugs:** `channelTTS` map not cleared on bot restart or guild leave – stale entries; voice name mapping may be fragile.

---

## 14. File Lookup Guide
### Authentication & Bot Startup
- **Read:** `index.js` (client creation, `.env` loading), `package.json`.
### Auto-TTS (channel-wide)
- **Read:** `index.js` → `messageCreate` → auto-TTS block (lines 152-176).
- **Related:** `tts.js`, `audioQueues` logic.
### On-Demand TTS Command (`b!tts` / `/tts`)
- **Read:** `index.js` → `messageCreate` → TTS command block (lines 182-214).
- **Related:** `tts.js`, `audioQueues`.
### Join / Leave TTS (`/jointts`, `/leavetts`)
- **Read:** `index.js` → `interactionCreate` → `jointts` block (lines 348-406) and `leavetts` block (lines 409-444).
- **Related:** `channelTTS` map, `audioQueues`.
### Slash Command Registration
- **Read:** `deploy-commands.js` (entire file).
### TTS Generation
- **Read:** `tts.js` (entire file).
### Invite System (partial)
- **Read:** `deploy-commands.js` (invite command definition) and commented sections in `index.js` (reaction handling, thread creation).
### Misc Utilities
- **Read:** `index.js` → `SUPPORTED_VOICES` set, `audioQueues` map, `channelTTS` map.
### Express Health Endpoint
- **Read:** `index.js` lines 1-10.

---

## 15. Common Workflows
1. **Add a New Slash Command** – Update `deploy-commands.js`, add handler in `index.js`, run `node deploy-commands.js`.
2. **Add a New Voice to TTS** – Append voice string to `SUPPORTED_VOICES` in `index.js` and `VOICE_MAP` in `tts.js`.
3. **Create a New Auto-TTS Channel** – Use `/jointts` in target text channel (optionally specify voice).
4. **Add Persistent Invite Logic** – Implement thread creation in `index.js` (uncomment and refine), store mappings in `inviteData` / `inviteThreads`.
5. **Run Tests / Lint** – Add test files under `test/` (currently none) and define `npm test` script.

---

## 16. AI Working Rules
- Never edit generated MP3 files – they are temporary and cleaned by the player idle handler or process exit cleanup.
- Always use the existing `audioQueues` map for any new voice-related feature; do not create separate maps.
- When adding a new command, update both `deploy-commands.js` and the corresponding handler in `index.js`.
- Do not duplicate TTS logic – reuse `generateTTS` from `tts.js`.
- Keep controllers thin – move business logic (e.g., message formatting) to helper functions or maps.
- Respect the env-based configuration – read all configurable values from `process.env`.
- Only modify files directly related to the requested change unless a refactor is required.
- Maintain clean-up of temporary files: on every new audio playback, ensure previous `currentFile` is deleted as in the existing `AudioPlayerStatus.Idle` handler.

---

## 17. Quick Reference
| Action | Command |
|--------|---------|
| **Start Bot (dev)** | `npm run dev` (runs `node index.js`) |
| **Register / Update Slash Commands** | `node deploy-commands.js` |
| **Set Env Variables** | Create `.env` with `DISCORD_TOKEN` and `DISCORD_CLIENT_ID` |
| **Run Tests** | *(none yet)* |
| **Lint** | *(not configured)* |
| **Clean Temporary MP3s** | Handled automatically; can manually delete `*.mp3` files in repo root |
| **Deploy (generic)** | Copy repo to server, `npm i`, set env, run `node index.js` |

---

## 18. AI Handoff Summary
The **bell-bot** repository implements a Discord bot that provides text-to-speech (TTS) capabilities both automatically for configured text channels and on demand via prefix commands or slash commands. The core of the system lives in `index.js`, which boots an Express health server, creates a `discord.js` client, and manages per-guild audio queues using a `Map` (`audioQueues`). Audio playback leverages `@discordjs/voice`; TTS audio files are generated by a helper module `tts.js` using the `msedge-tts` library to request speech from Microsoft's Edge Read Aloud API. Generated MP3 files are stored temporarily in the repo root and cleaned up when playback finishes, errors, or the process exits.

Slash commands are defined centrally in `deploy-commands.js` using `SlashCommandBuilder` and registered globally via the Discord REST API. The bot currently supports commands for joining/leaving voice channels with auto-TTS (`/jointts`, `/leavetts`), on-demand TTS (`b!tts`/`tts`), user/role prompts (`pabuhat`, `pabuhatrole`), anonymous messaging, and a rudimentary invite system (partially commented). The command handling logic resides in the `client.on('interactionCreate')` block of `index.js`.

State is kept in several in-memory maps:
- `audioQueues` – per-guild playback queue, player, current file, voice connection.
- `channelTTS` – tracks which text channels have auto-TTS enabled and associated voice channel.
- `inviteData`, `inviteThreads`, `spamMention` – caches for invite and spam features.

Configuration is minimal: a `.env` file supplies `DISCORD_TOKEN` (bot authentication) and `DISCORD_CLIENT_ID` (command registration). `ffmpeg-static` provides the FFmpeg binary; its path is exported to `process.env.FFMPEG_PATH`. No persistent database is used.

The code follows a straightforward pattern:
1. **Receive event** -> validate -> (optional) generate TTS via `generateTTS` -> enqueue file in `audioQueues`.
2. **Playback** – `playNext` pulls the next file, creates an audio resource, and plays it; on idle or error the current file is deleted and the next track is started.
3. **Command registration** is a one-time script; new commands require edits in both `deploy-commands.js` and the interaction handler.

Open work includes completing the invite/thread workflow, adding a test suite, and improving cleanup of temporary audio files. The architecture is intentionally simple: a single process, in-memory state, and clear separation between Discord interactions, audio queue management, and TTS generation. Future developers should extend functionality by re-using the existing maps and helper functions, avoiding duplicate logic, and always updating the command registration script when adding new slash commands.

---

## 19. Maintenance
- **When adding/modifying features:** Update the relevant section(s) of this document (e.g., new command -> add to *Slash Command Overview* and *File Lookup Guide*). Keep the **File Lookup Guide** accurate; it is the primary navigation aid for AI agents.
- **Remove obsolete entries** when code is deleted.
- **Do not expand the document beyond ~2,000 lines** – keep each section concise and focused on navigation aid.
- **Version bump** in `package.json` when releasing changes; update the **Repository Version** field here.
