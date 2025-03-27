import { glob } from 'glob';
import path from 'path';
import Logger from '../utils/logger.js';
import {Command} from "../../@types/types.js";
import { pathToFileURL, fileURLToPath } from 'url';

class CommandHandler {
    private static instance: CommandHandler;
    private commands: Map<string, Command> = new Map();
    private aliasMap: Map<string, string> = new Map();
    private initialized: boolean = false;

    private constructor() {
    }

    public static getInstance(): CommandHandler {
        if (!CommandHandler.instance) {
            CommandHandler.instance = new CommandHandler();
        }
        return CommandHandler.instance;
    }

    async loadCommands(): Promise<void> {
        if (this.initialized) {
            Logger.debug('Commands already loaded, skipping initialization');
            return;
        }

        try {
            const __dirname = path.dirname(fileURLToPath(import.meta.url));
            // Go up one directory since we're in core/ and need to access cli/
            const parentDir = path.resolve(__dirname, '..');
            const commandFiles = await glob('cli/**/*.js', { cwd: parentDir });

            for (const file of commandFiles) {
                try {
                    // Create proper file URL that works on all platforms
                    const fullPath = path.join(parentDir, file);
                    const fileUrl = pathToFileURL(fullPath).href;

                    const commandModule = await import(fileUrl);
                    const command: Command = commandModule.default;

                    if (!command || !command.name || !command.run) {
                        Logger.warn(`Invalid command format in file: ${file}`);
                        continue;
                    }

                    this.commands.set(command.name, command);

                    if (command.aliases && Array.isArray(command.aliases)) {
                        command.aliases.forEach(alias => {
                            this.aliasMap.set(alias, command.name);
                        });
                    }

                    Logger.debug(`Loaded command: ${command.name}`);
                } catch (err: any) {
                    Logger.error(`Failed to load command from file ${file}: ${err.message}`);
                }
            }

            Logger.debug(`Loaded ${this.commands.size} commands.`);
            this.initialized = true;
        } catch (err: any) {
            Logger.error(`Failed to load commands: ${err.message}`);
        }
    }

    parseArguments(args: string[]): { commandName: string, parsedArgs: string[], options: Record<string, any> } {
        const commandName = args[0];
        const parsedArgs = [];
        const options: Record<string, any> = {};

        let i = 1;
        while (i < args.length) {
            const arg = args[i];

            if (arg.startsWith('--')) {
                const optionName = arg.slice(2);

                if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
                    options[optionName] = args[i + 1];
                    i += 2;
                } else {
                    options[optionName] = true;
                    i++;
                }
            } else if (arg.startsWith('-')) {
                const shortOption = arg.slice(1);

                const matchedCommand = Array.from(this.commands.values()).find(cmd =>
                    cmd.options?.some(opt => opt.alias === shortOption)
                );

                if (matchedCommand) {
                    const option = matchedCommand.options.find(opt => opt.alias === shortOption);
                    if (option) {
                        options[option.name] = true;
                    }
                } else {
                    options[shortOption] = true;
                }
                i++;
            } else {
                parsedArgs.push(arg);
                i++;
            }
        }

        return { commandName, parsedArgs, options };
    }

    async executeCommand(args: string[]): Promise<void> {
        if (!args.length) {
            Logger.error('No command specified');
            return;
        }

        const { commandName, parsedArgs, options } = this.parseArguments(args);

        let resolvedCommandName = commandName;
        if (!this.commands.has(commandName) && this.aliasMap.has(commandName)) {
            resolvedCommandName = this.aliasMap.get(commandName) || "unknown";
        }

        const command = this.commands.get(resolvedCommandName);

        if (!command) {
            Logger.error(`Unknown command: ${commandName}`);
            return;
        }

        try {
            if (command.options) {
                command.options.forEach(option => {
                    if (option.default !== undefined && options[option.name] === undefined) {
                        options[option.name] = option.default;
                    }

                    if (option.required && options[option.name] === undefined) {
                        throw new Error(`Missing required option: ${option.name}`);
                    }

                    if (options[option.name] !== undefined && option.type) {
                        switch (option.type) {
                            case 'number':
                                options[option.name] = Number(options[option.name]);
                                break;
                            case 'boolean':
                                if (typeof options[option.name] === 'string') {
                                    options[option.name] = options[option.name].toLowerCase() === 'true';
                                }
                                break;
                        }
                    }
                });
            }

            await command.run(parsedArgs, options);
        } catch (err: any) {
            Logger.error(`Failed to execute command ${commandName}: ${err.message}`);
        }
    }

    getCommands(): Command[] {
        return Array.from(this.commands.values());
    }

    resetForTesting(): void {
        this.commands.clear();
        this.aliasMap.clear();
        this.initialized = false;
    }
}

const commandHandler = CommandHandler.getInstance();
export default commandHandler;