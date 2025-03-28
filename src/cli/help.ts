import chalk from 'chalk';
import Logger from '../utils/logger.js';
import {SPOTIFY_COLOR} from '../utils/constants.js';
import {Command} from "../@types/types.js";
import CommandHandler from "../core/command-handler.js";

const help: Command = {
    name: "help",
    aliases: ["commands", "h"],
    description: "Display help information about available commands",
    options: [
        {
            name: "command",
            alias: "c",
            description: "Show help for a specific command",
            required: false,
            type: "string"
        }
    ],
    run: async (args: string[], options: Record<string, any>): Promise<void> => {
        const specificCommand = options.command || args[0];

        if (specificCommand) {
            const commands = CommandHandler.getCommands();
            const command = commands.find(cmd =>
                cmd.name === specificCommand ||
                (cmd.aliases && cmd.aliases.includes(specificCommand))
            );

            if (!command) {
                return Logger.error(`Unknown command: ${specificCommand}`);
            }

            Logger.info(`Command: ${chalk.hex(SPOTIFY_COLOR)(command.name)}`);
            if (command.aliases && command.aliases.length) {
                Logger.info(`Aliases: ${command.aliases.map(a => chalk.hex(SPOTIFY_COLOR)(a)).join(', ')}`);
            }
            Logger.info(`Description: ${command.description}`);

            if (command.options && command.options.length) {
                Logger.info('');
                Logger.info('Options:');
                command.options.forEach(option => {
                    const required = option.required ? chalk.red(' (required)') : '';
                    const defaultValue = option.default !== undefined ? chalk.gray(` (default: ${option.default})`) : '';
                    const alias = option.alias ? `, -${option.alias}` : '';
                    Logger.info(`  --${option.name}${alias}${required}${defaultValue}: ${option.description}`);
                });
            }
        } else {
            Logger.info('Available commands:');

            const commands = CommandHandler.getCommands();
            const maxLength = Math.max(...commands.map(cmd => cmd.name.length));

            commands.forEach(command => {
                Logger.info(`  ${chalk.hex(SPOTIFY_COLOR)(command.name.padEnd(maxLength))}  ${command.description}`);
            });

            Logger.info('');
            Logger.info('For more information about a specific command, run:');
            Logger.info(`  ${chalk.hex(SPOTIFY_COLOR)('spotuya help -c command')}`);
        }
    }
};

export default help;