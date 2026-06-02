require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');

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

const inviteData = new Map();
const inviteThreads = new Map();

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
});
client.on('interactionCreate', async (interaction) => {
    try {
        if (!interaction.isChatInputCommand()) return;
        if (interaction.commandName === 'invite') {
            const code = interaction.options.getString('code');
            const role = interaction.options.getRole('role');

            // Reply and fetch the sent message so we can store its id
            const msg = await interaction.reply({
                content: `React on this message to get your invite code 🔑 (role: <@&${role.id}>)`,
                fetchReply: true
            });

            // SAVE CODE AND ROLE WITH MESSAGE ID
            inviteData.set(msg.id, code);
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
        if(interaction.commandName === 'annonimous') {
            const message = interaction.options.getString('annonimousmessage');
            const user = interaction.options.getUser('user');
            await interaction.deferReply({ ephemeral: true });
            const userMention = user ? `<@${user.id}>` : '';
            const messageFinal = userMention ? `To: **${userMention}**\n||${message}||` : `||${message}||`;
            await interaction.channel.send({ content: `*Annonimous message incomming* \n >>> ${messageFinal}` });
            await interaction.deleteReply();
        }
    } catch (error) {
        console.error('Interaction error:', error);
    }
});

// client.on('messageReactionAdd', async (reaction, user) => {
//     try {
//         if (user.bot) return;

//         // fetch partials if needed
//         if (reaction.partial) await reaction.fetch();
//         if (reaction.message.partial) await reaction.message.fetch();

//         const message = reaction.message;
//         const guild = message.guild;

//         const data = inviteData.get(message.id);
//         if (!data) return;

//         let thread = inviteThreads.get(message.id);
//         console.log('threads  '+thread);
//         // If thread already exists → reuse it
//         if (!thread) {
//             thread = await message.channel.threads.create({
//                 name: `invite-${message.id}`,
//                 autoArchiveDuration: 1,
//                 reason: 'Invite system thread'
//             });

//             inviteThreads.set(message.id, thread);
//         }

//         // Add user if not already inside
//         try {
//             await thread.members.add(user.id);
//         } catch (err) {
//             // user might already be in thread → ignore error
//         }

//         const member = await guild.members.fetch(user.id);

//         // send message only in thread
//         await thread.send(
//             `👋 <@${user.id}> joined\n🔑 Code: **${data.code}**\n🎉>`
//         );
//     } catch (err) {
//         console.error('Error handling reaction add:', err);
//     }
// });
client.login(process.env.DISCORD_TOKEN);