require('dotenv').config();
const { Client, GatewayIntentBits, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User]
});

const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    StreamType
} = require("@discordjs/voice");
const generateTTS = require("./tts");
const ffmpegPath = require("ffmpeg-static");
process.env.FFMPEG_PATH = ffmpegPath;

const SUPPORTED_VOICES = new Set([
    "angelo PH",
    "danica PH",
    "james PH",
    "raphael PH",
    "aria US",
    "guy US",
    "alloy US",
    "nanami JP",
    "keita JP",
    "haruka JP",
    "mai JP",
    "ichiro JP",
    "japanese JP",
    "jp"
]);

function playAudio(connection, filePath) {
    const player = createAudioPlayer();
    const resource = createAudioResource(filePath, { inputType: StreamType.Arbitrary });

    player.play(resource);
    connection.subscribe(player);

    player.on(AudioPlayerStatus.Playing, () => {
        console.log('TTS audio playing');
    });
    player.on('error', error => {
        console.error('Audio player error:', error);
    });
    connection.on('error', error => {
        console.error('Voice connection error:', error);
    });

    player.on(AudioPlayerStatus.Idle, () => {
        player.stop();
    });
}

const inviteData = new Map();
const inviteThreads = new Map();
// channelId -> { connection, voiceChannelId, guildId, adapterCreator, voice }
const channelTTS = new Map();

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    // console.log(`[message] ${message.guild?.name || 'DM'} ${message.author.tag}: ${message.content}`);

    // if (message.content === 'porbs' ||
    //     message.content === `<@${'1254235136506073189'}>` ||
    //     message.content === `<@!${'1254235136506073189'}>`) {
    //     message.reply('Dahil Special ka, Pakyu ka!');
    // }
    // if(message.content.includes('porbs')) {
    //     message.reply('Dahil Special ka, Pakyu ka!');
    // }
    if (message.mentions.users.size > 0) {
        // const mentionOnly = message.content.trim().split(/\s+/).every(token => /^<@!?\d+>$/.test(token));
        // if (mentionOnly) return; // ignore messages that contain only mentions

        message.mentions.users.forEach(user => {
            if (user.id === message.author.id) return;
            console.log(`Mentioned: ${user.username}`);
            // message.reply(`<@${user.id}> Hanap kana ni ${message.author} buhatin mo na daw sya`)

        });
    }

    // If this channel is enabled for auto-TTS, convert chat messages to speech
    try {
        const ttsConfig = channelTTS.get(message.channel.id);
        if (ttsConfig && !message.author.bot) {
            const textToSpeak = message.content.trim();
            if (textToSpeak.length > 0) {
                // ensure connection exists
                let connection = ttsConfig.connection;
                if (!connection) {
                    connection = joinVoiceChannel({
                        channelId: ttsConfig.voiceChannelId,
                        guildId: ttsConfig.guildId,
                        adapterCreator: ttsConfig.adapterCreator
                    });
                    ttsConfig.connection = connection;
                    channelTTS.set(message.channel.id, ttsConfig);
                }

                await generateTTS(textToSpeak, ttsConfig.voice);
                playAudio(connection, "./tts.mp3");
            }
            return; // don't process other tts commands for this message
        }
    } catch (err) {
        console.error('Auto-TTS error:', err);
    }

    if (message.content.startsWith('b!tts ') || message.content.startsWith('tts ')) {
        const command = message.content.startsWith('b!tts ')
            ? message.content.slice(5)
            : message.content.slice(4);
        const args = command.trim().split(/\s+/);
        let voice = null;

        if (args.length > 1 && SUPPORTED_VOICES.has(args[0].toLowerCase())) {
            voice = args.shift().toLowerCase();
        }

        const text = args.join(" ").trim();
        if (!text) return message.reply("Give me text!");

        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.reply("Join a voice channel first!");

        try {
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator
            });

            // 1. generate speech using Python
            await generateTTS(text, voice);

            // 2. play the mp3 file
            playAudio(connection, "./tts.mp3");

        } catch (error) {
            console.error("TTS Error:", error);
            message.reply("Sorry, something went wrong with TTS.");
        }
    }
});
client.on('interactionCreate', async (interaction) => {
    try {
        // Handle button interactions
        if (interaction.isButton()) {
            if (interaction.customId === 'invite_getcode') {
                const code = inviteData.get(interaction.message.id);
                if (code) {
                    await interaction.reply({
                        content: `🔑 Your invite code: **${code.code}**`,
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: '❌ No code found for this invite',
                        ephemeral: true
                    });
                }
            }
            return;
        }

        if (!interaction.isChatInputCommand()) return;
        if (interaction.commandName === 'invite') {
            const code = interaction.options.getString('code');
            const role = interaction.options.getRole('role');

            // Create join button
            const button = new ButtonBuilder()
                .setCustomId('invite_getcode')
                .setLabel('get code')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder()
                .addComponents(button);

            // Reply and fetch the sent message so we can store its id
            // const msg = await interaction.reply({
            //     content: `<@&${role.id}> get your invite code 🔑`,
            //     components: [row],
            //     fetchReply: true
            // });
            const msg = await interaction.channel.send({
                content: `<@&${role.id}> get your invite code 🔑`,
                components: [row],
                fetchReply: true
            });

            // SAVE CODE AND ROLE WITH MESSAGE ID
            inviteData.set(msg.id, { code });
        }
        if (interaction.commandName === 'pabuhat') {
            const target = interaction.options.getUser('mention');

            // Acknowledge the interaction so it doesn't time out,
            // then send the actual message as a separate channel message.
            await interaction.deferReply({ ephemeral: true });

            const responses = [
                `<@${target.id}> Hanap kana ni ${interaction.user} buhatin mo na daw sya`,
                `Oye <@${target.id}>, ${interaction.user} says ikaw na bahala!`,
                `<@${target.id}> bigay mo ng effort, sabi ni ${interaction.user}`,
                `${interaction.user} wants <@${target.id}> to handle this one. Go go go!`,
                `Ano na <@${target.id}> — ${interaction.user} is calling you out, Buhatin mo na!`
            ];

            const randomText = responses[Math.floor(Math.random() * responses.length)];

            await interaction.channel.send({ content: randomText });

            await interaction.deleteReply();
        }

        if (interaction.commandName === 'pabuhatrole') {
            const role = interaction.options.getRole('role');
            const code = interaction.options.getString('code');
            await interaction.deferReply({ ephemeral: true });

            const roleMention = `<@&${role.id}>`;
            let responses = [];

            if (code) {
                responses = [
                    `Let's play ${roleMention}! Ready ka na? Ito ang code: \`\`\`**${code}**\`\`\``,
                    `Time to play ${roleMention} — game on! Here's your code: \`\`\`**${code}**\`\`\``,
                    `Okay ${roleMention}, let's play na! Your code is \`\`\`**${code}**\`\`\``,
                    `${roleMention} is up next, let's play! Here's the code: \`\`\`**${code}**\`\`\``,
                    `Who's in for ${roleMention}? Let's play now! Your code: \`\`\`**${code}**\`\`\``
                ];
            } else {
                responses = [
                    `Let's play ${roleMention}! Ready ka na?`,
                    `Time to play ${roleMention} — game on!`,
                    `Okay ${roleMention}, let's play na!`,
                    `${roleMention} is up next, let's play!`,
                    `Who's in for ${roleMention}? Let's play now!`
                ];
            }

            const randomText = responses[Math.floor(Math.random() * responses.length)];

            await interaction.channel.send({ content: randomText });

            await interaction.deleteReply();
        }
        if (interaction.commandName === 'annonimous') {
            const message = interaction.options.getString('annonimousmessage');
            const user = interaction.options.getUser('user');
            await interaction.deferReply({ ephemeral: true });
            const userMention = user ? `<@${user.id}>` : '';
            const messageFinal = userMention ? `To: **${userMention}**\n||${message}||` : `||${message}||`;
            await interaction.channel.send({ content: `*Annonimous message incomming* \n >>> ${messageFinal}` });
            await interaction.deleteReply();
        }
        if (interaction.commandName === 'jointts') {
            // ensure member context exists
            if (!interaction.member) {
                return interaction.reply({ content: 'Could not get member information.', ephemeral: true });
            }

            const voiceChannel = interaction.member.voice.channel;
            if (!voiceChannel) return interaction.reply({ content: 'Join a voice channel first!', ephemeral: true });

            // check if guild exists and bot is in it with voice adapter
            if (!interaction.guild || !interaction.guild.voiceAdapterCreator) {
                return interaction.reply({ content: 'Bot is not in this server! Please invite the bot first.', ephemeral: true });
            }

            // optional voice option from the slash command
            const voiceOpt = interaction.options?.getString ? interaction.options.getString('voice') : null;

            await interaction.deferReply({ ephemeral: true });
            try {
                const radomGreetings = [
                    'Narito na ang inyong tagapagligtas! Bell-Bot is here to save the day!',
                    'Magbigay-daan, dumating na ang hari ng bot!',
                    'Tumabi kayo, may dumating na pogi',
                    'Breaking news: Dumating na ako!',
                    'Attention everyone, Bell-Bot has entered the building!',
                    'Ladies and gentlemen, please welcome the one and only Bell-Bot!',
                    'Hold on to your seats, Bell-Bot is here to take over!',
                    'Naka-check in na ang pangunahing karakter.',
                    'Bell-Bot has arrived, let the fun begin!',
                    'Ayan na, nasa eksena na ako.',
                    'Nagpakita na ang main character.',
                    'Loading complete. Dumating na ako.',
                    'Magsiyuko kayo, sapagkat narito na ako.',
                    'Sa wakas, pinagpala na kayo ng aking presensya.'
                ];
                const randomText = radomGreetings[Math.floor(Math.random() * radomGreetings.length)];
                await generateTTS(randomText, voiceOpt || null);


                const connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: voiceChannel.guild.id,
                    adapterCreator: voiceChannel.guild.voiceAdapterCreator
                });
                // save mapping for this text channel
                channelTTS.set(interaction.channel.id, {
                    connection,
                    voiceChannelId: voiceChannel.id,
                    guildId: voiceChannel.guild.id,
                    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                    voice: voiceOpt || null
                });
                // try {
                // const radomGreetings = [
                //     'Pakyu kayong lahat, Simulan na natin!',
                //     'King ina nyo, Simulan na natin, LezzGo!',
                //     'Mga putapete, Pakyu kayong lahat, G na to!',
                //     'Hello mga bata, Simulan na natin, Pakyu kayong lahat!',
                //     'Oye mga putapete, Simulan na natin, Pakyu kayong lahat!',
                //     'Pakyu kayong lahat, Simulan na natin, LezzGo!',
                // ];

                playAudio(connection, "./tts.mp3");
                await interaction.editReply({ content: `Joined ${voiceChannel.name} and enabled TTS for this channel.` });
            } catch (err) {
                console.error('jointts error:', err);
                await interaction.editReply({ content: 'Failed to join voice channel for TTS.' });
            }
        }

        if (interaction.commandName === 'leavetts') {
            await interaction.deferReply({ ephemeral: true });
            const cfg = channelTTS.get(interaction.channel.id);
            if (!cfg) {
                await interaction.editReply({ content: 'This channel is not enabled for TTS.' });
            } else {
                try {
                    if (cfg.connection && typeof cfg.connection.destroy === 'function') cfg.connection.destroy();
                } catch (err) {
                    console.error('Error destroying connection:', err);
                }
                // optional voice option from the slash command
                const voiceOpt = interaction.options?.getString ? interaction.options.getString('voice') : null;

                // await interaction.deferReply({ ephemeral: true });
                const radomGreetings = [
                    'Paalam hangang sa muli, Bell-Bot signing off!',
                    'Salamat sa pagsama sa akin, Bell-Bot is leaving the stage!',
                    'Hasta la vista, Bell-Bot is out of here!',
                    'Goodbye everyone, Bell-Bot is signing out!',
                    'Bell-Bot is taking a break, see you all later!',
                    'It’s not goodbye, it’s see you later! Bell-Bot is leaving for now.',
                ];
                const randomText = radomGreetings[Math.floor(Math.random() * radomGreetings.length)];
                await generateTTS(randomText, voiceOpt || null);


                const connection = joinVoiceChannel({
                    channelId: interaction.voiceChannel.id,
                    guildId: interaction.voiceChannel.guild.id,
                    adapterCreator: interaction.voiceChannel.guild.voiceAdapterCreator
                });
                // save mapping for this text channel
                channelTTS.set(interaction.channel.id, {
                    connection,
                    voiceChannelId: interaction.voiceChannel.id,
                    guildId: interaction.voiceChannel.guild.id,
                    adapterCreator: interaction.voiceChannel.guild.voiceAdapterCreator,
                    voice: voiceOpt || null
                });
                playAudio(connection, "./tts.mp3");
                channelTTS.delete(interaction.channel.id);
                await interaction.editReply({ content: 'Disabled TTS and left the voice channel.' });
            }
        }
    } catch (error) {
        console.error('Interaction error:', error);
    }
});

client.on('messageReactionAdd', async (reaction, user) => {
    try {
        if (user.bot) return;
        const message = reaction.message;
        const code = inviteData.get(message.id);
        if (!code) return;

        // ------------------------------------------------------------------------------
        // // fetch partials if needed
        // if (reaction.partial) await reaction.fetch();
        // if (reaction.message.partial) await reaction.message.fetch();

        // const message = reaction.message;
        // const guild = message.guild;

        // const data = inviteData.get(message.id);
        // if (!data) return;

        // let thread = inviteThreads.get(message.id);
        // console.log('threads  '+thread);
        // // If thread already exists → reuse it
        // if (!thread) {
        //     thread = await message.channel.threads.create({
        //         name: `invite-${message.id}`,
        //         autoArchiveDuration: 1,
        //         reason: 'Invite system thread'
        //     });

        //     inviteThreads.set(message.id, thread);
        // }

        // // Add user if not already inside
        // try {
        //     await thread.members.add(user.id);
        // } catch (err) {
        //     // user might already be in thread → ignore error
        // }

        // const member = await guild.members.fetch(user.id);

        // // send message only in thread
        // await thread.send(
        //     `👋 <@${user.id}> joined\n🔑 Code: **${data.code}**\n🎉>`
        // );
    } catch (err) {
        console.error('Error handling reaction add:', err);
    }
});
client.login(process.env.DISCORD_TOKEN);