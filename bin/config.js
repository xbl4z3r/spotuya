import Logger from "./logger.js";
import os from "os";
import path from "path";
import fs from "fs";
import Utils from "./utils.js";

const CONFIG_FILE_NAME = 'config.json';

const DEFAULT_CONFIG = {
    devices: [],
    spotify: {
        accessToken: "",
        refreshToken: "",
        clientId: "",
        clientSecret: ""
    },
    configVersion: Utils.getVersion(),
    refreshRate: 1000
}

export default class Config {

    static config = {};
    static configPath = '';

    static getConfigPath(shouldClean = false) {
        // if on windows check for %appdata%/spotuya/config.json
        // if on linux check for ~/.config/spotuya/config.json
        // if on mac check for ~/Library/Application Support/spotuya/config.json

        // if config file exists, return it
        // if not, create it and return it
        switch (os.platform()) {
            case 'win32':
                this.configPath = path.join(process.env.APPDATA, 'spotuya');

                if (!fs.existsSync(this.configPath)) fs.mkdirSync(this.configPath);

                this.configPath = path.join(this.configPath, CONFIG_FILE_NAME);

                if (!fs.existsSync(this.configPath) || shouldClean) fs.writeFileSync(this.configPath, JSON.stringify(DEFAULT_CONFIG, null, 4));
                break;
            case 'linux':
                this.configPath = path.join(os.homedir(), '.config', 'spotuya');

                if (!fs.existsSync(this.configPath)) fs.mkdirSync(this.configPath);

                this.configPath = path.join(this.configPath, CONFIG_FILE_NAME);

                if (!fs.existsSync(this.configPath) || shouldClean) fs.writeFileSync(this.configPath, JSON.stringify(DEFAULT_CONFIG, null, 4));
                break;
            case 'darwin':
                this.configPath = path.join(os.homedir(), 'Library', 'Application Support', 'spotuya');

                if (!fs.existsSync(this.configPath)) fs.mkdirSync(this.configPath);

                this.configPath = path.join(this.configPath, CONFIG_FILE_NAME);

                if (!fs.existsSync(this.configPath) || shouldClean) fs.writeFileSync(this.configPath, JSON.stringify(DEFAULT_CONFIG, null, 4));
                break;
            case "android":
                this.configPath = path.join(os.homedir(), 'spotuya');

                if (!fs.existsSync(this.configPath)) fs.mkdirSync(this.configPath);

                this.configPath = path.join(this.configPath, CONFIG_FILE_NAME);

                if (!fs.existsSync(this.configPath) || shouldClean) fs.writeFileSync(this.configPath, JSON.stringify(DEFAULT_CONFIG, null, 4));
                break;
            default:
                Logger.fatal('Unsupported platform');
        }
    }

    static getConfigFromDisk(shouldClean = false) {
        const startTime = new Date().getTime();
        if (this.configPath === '') this.getConfigPath(shouldClean);

        const config = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));

        Logger.debug(`Loaded config in ${new Date().getTime() - startTime}ms`);
        this.config = config;
        return config;
    }

    static saveConfig(config = undefined) {
        if (this.config === {} && config === undefined) this.getConfigFromDisk();
        else if (config !== undefined) this.config = config;

        const startTime = new Date().getTime();

        fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 4));

        Logger.debug(`Saved config in ${new Date().getTime() - startTime}ms`);
    }

    static addDevice(device) {
        if (this.config === {}) this.getConfigFromDisk();
        Logger.debug(`Adding device ${device.name} to config...`);
        this.config.devices.push(device);
        this.saveConfig();
    }

}