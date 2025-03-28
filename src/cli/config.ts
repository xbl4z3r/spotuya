import {Command} from "../@types/types.js";
import Logger from "../utils/logger.js";
import Config from "../config/config.js";

const config: Command = {
    name: "config",
    aliases: ["cfg", "conf"],
    description: "Update the configuration. This is for advanced users only. Use at your own risk.",
    options: [
        {
            name: "key",
            alias: "k",
            description: "Config key to update.",
            required: false,
            type: "string"
        },
        {
            name: "value",
            alias: "v",
            description: "New value for the config key.",
            required: false,
            type: "string"
        }
    ],
    run: async (args: string[], options: Record<string, any>): Promise<void> => {
        const keys = Config.getConfigKeys();
        const key = options.key || args[0];
        const value = options.value || args[1];
        if (!key) {
            Logger.info("No key provided. Available keys:");
            keys.forEach(k => Logger.info(`- ${k}`));
            return;
        }
        if (!value) {
            Logger.info(`No value provided for key ${key}. Current value: ${Config.getValue(key)}`);
            return;
        }
        if (!keys.includes(key)) {
            Logger.error(`Invalid key: ${key}. Available keys: ${keys.join(", ")}`);
            return;
        }
        if (key === "configVersion") {
            Logger.error(`You cannot change the configVersion key.`);
            return;
        }
        Config.setValue(key, value);
        Logger.info(`Successfully updated key ${key} to value ${value}.`);
    }
}

export default config;