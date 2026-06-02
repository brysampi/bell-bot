require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');

const commands = [
    new SlashCommandBuilder()
        .setName('kingina')
        .setDescription('King ina mo din')
        .toJSON(),
    // new SlashCommandBuilder()
    //     .setName('invite')
    //     .setDescription('Invite players via code')
    //     .addStringOption(option =>
    //         option
    //             .setName('code')
    //             .setDescription('Code')
    //             .setRequired(true)
    //     )
    //     .addRoleOption(option =>
    //         option
    //             .setName('role')
    //             .setDescription('Role')
    //             .setRequired(true)
    //     )
    //     .toJSON(),
    new SlashCommandBuilder()
        .setName('pabuhat')
        .setDescription('@someone to carry you')
        .addUserOption(option =>
            option
                .setName('mention')
                .setDescription('The user to carry')
                .setRequired(true)
        )
        .toJSON(),
    new SlashCommandBuilder()
        .setName('pabuhatrole')
        .setDescription('@role to play you')
        .addRoleOption(option =>
            option
                .setName('role')
                .setDescription('The role to play with you')
                .setRequired(true)
        ).addStringOption(option =>
            option
                .setName('code')
                .setDescription('(optional) The code to get')
                .setRequired(false)
        )
        .toJSON(),
    new SlashCommandBuilder()
        .setName('annonimous')
        .setDescription('chat annonimously')
        .addStringOption(option =>
            option
                .setName('annonimousmessage')
                .setDescription('The message to send annonimously')
                .setRequired(true)
        ).addUserOption(option =>
            option
                .setName('user')
                .setDescription('The user to mention in the annonimous message')
                .setRequired(false)
        )
        .toJSON(),
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Registering slash commands...');

        await rest.put(
            Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
            { body: commands }
        );

        console.log('Commands registered!');
    } catch (error) {
        console.error(error);
    }
})();