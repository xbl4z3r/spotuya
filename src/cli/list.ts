import Logger from "../utils/logger.js";
import Config from "../config/config.js";
import {Command, DeviceData} from "../@types/types.js";

const list: Command = {
    name: "list",
    aliases: ["ls"],
    description: "List all devices in the configuration file.",
    options: [],
    run: async (args: string[], options: Record<string, any>) => {
        Logger.info("Devices in your configuration file:");
        Config.getDevices().forEach((device: DeviceData, index: number) => {
            Logger.info("Device " + (index + 1) + ": ID " + device.id + " | Key " + device.key);
        });
    }
}

export default list;