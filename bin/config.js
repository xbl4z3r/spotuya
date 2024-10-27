import Logger from "./logger.js";
import os from "os";
import path from "path";
import fs from "fs";
import Utils from "./utils.js";
import PM2Provider from "./pm2provider.js";

const CONFIG_FILE_NAME = 'config.json';

const DEFAULT_CONFIG = {
    devices: [],
    tuya: {
        clientId: "",
        clientSecret: "",
        region: "",
        userId: "",
    },
    spotify: {
        accessToken: "",
        refreshToken: "",
        clientId: "",
        clientSecret: "",
    },
    configVersion: "2.0.0",
    refreshRate: 1000,
    startOnBoot: false,
    port: 4815,
}

export default class Config {
    static config = {};
    static configPath = '';
    static useEnv = false;

    static getConfigPath() {
        this.configPath = Utils.getApplicationDirectory()
        switch (os.platform()) {
            case 'win32' || 'linux' || 'darwin' || 'android':
                this.configPath = path.join(this.configPath, CONFIG_FILE_NAME);
                if (!fs.existsSync(this.configPath)) fs.writeFileSync(this.configPath, JSON.stringify(DEFAULT_CONFIG, null, 4));
                break;
            default:
                Logger.fatal('Unsupported platform');
        }
    }
    
    static loadConfig() {
        const startTime = new Date().getTime();
        if (this.useEnv) this.loadConfigFromEnv();
        else this.loadConfigFromDisk();
        Logger.debug(`Loaded config in ${new Date().getTime() - startTime}ms`);
    }
    
    static loadConfigFromEnv() {
        this.config = {
            devices: [],
            tuya: {
                clientId: process.env.TUYA_CLIENT_ID,
                clientSecret: process.env.TUYA_CLIENT_SECRET,
                region: process.env.TUYA_REGION,
                userId: process.env.TUYA_USER_ID
            },
            spotify: {
                accessToken: "",
                refreshToken: process.env.SPOTIFY_REFRESH_TOKEN,
                clientId: process.env.SPOTIFY_CLIENT_ID,
                clientSecret: process.env.SPOTIFY_CLIENT_SECRET
            },
            configVersion: process.env.CONFIG_VERSION || "2.0.0",
            refreshRate: process.env.REFRESH_RATE || 1000,
            startOnBoot: process.env.START_ON_BOOT || false,
            port: process.env.PORT || 4815
        };
        process.env.DEVICES.split(',').forEach(device => {
            this.config.devices.push({
                id: device,
                name: "Device",
                key: "unknown"
            });
        });
    }

    static loadConfigFromDisk() {
        if (this.configPath === '') this.getConfigPath();
        this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
    }

    static saveConfig(config = undefined) {
        if (this.useEnv) return Logger.warn("Cannot save config when using environment variables.");
        if (this.config === {} && config === undefined) this.loadConfigFromDisk();
        else if (config !== undefined) this.config = config;

        const startTime = new Date().getTime();

        fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 4));

        Logger.debug(`Saved config in ${new Date().getTime() - startTime}ms`);
    }

    static cleanConfig() {
        Logger.debug('Cleaning config...');
        if (this.configPath === '') this.getConfigPath();
        fs.writeFileSync(this.configPath, JSON.stringify(DEFAULT_CONFIG, null, 4));
        this.config = DEFAULT_CONFIG;
        Logger.info("Successfully cleaned the configuration file.");
    }

    static addDevice(device) {
        if (this.config === {}) this.loadConfig();
        let exists = false;
        this.config.devices.forEach(d => {
            if (d.id === device.id) exists = true;
        });
        if (exists) return Logger.warn(`Device ${device.name} already exists in config.`);
        Logger.debug(`Adding device ${device.name} to config...`);
        this.config.devices.push(device);
        this.saveConfig();
    }
    
    static addDevices(devices) {
        devices.forEach(device => {
            this.addDevice(device);
        });
    }
    
    static setTuyaConfig(config) {
        if (this.config === {}) this.loadConfig();
        Logger.debug(`Setting tuya config...`);
        this.config.tuya = config;
        this.saveConfig();
    }
    
    static setStartOnBoot(value) {
        if (this.config === {}) this.loadConfig();
        Logger.debug(`Setting start on boot to ${value}...`);
        this.config.startOnBoot = value;
        if (value) PM2Provider.createTask();
        else PM2Provider.removeTask();
        this.saveConfig();
    }

    static setRefreshRate(value) {
        if (this.config === {}) this.loadConfig();
        Logger.debug(`Setting refresh rate to ${value}...`);
        this.config.refreshRate = value;
        this.saveConfig();
    }

    static setConfigVersion(version) {
        if (this.config === {}) this.loadConfig();
        Logger.debug(`Setting config version to ${version}...`);
        this.config.configVersion = version;
        this.saveConfig();
    }

    static setSpotifyConfig(config) {
        if (this.config === {}) this.loadConfig();
        Logger.debug(`Setting spotify config...`);
        this.config.spotify = config;
        this.saveConfig();
    }
    
    static setPort(port) {
        if (this.config === {}) this.loadConfig();
        Logger.debug(`Setting port to ${port}...`);
        this.config.port = port;
        this.saveConfig();
    }

    static setValue(key, value) {
        if (this.config === {}) this.loadConfig();
        Logger.debug(`Setting ${key} to ${value}...`);
        this.config[key] = value;
        if (key === 'startOnBoot' && value) PM2Provider.createTask();
        else if (key === 'startOnBoot' && !value) PM2Provider.removeTask();
        this.saveConfig();
    }

    static getConfigVersion() {
        if (this.config === {}) this.loadConfig();
        return this.config.configVersion;
    }

    static getRefreshRate() {
        if (this.config === {}) this.loadConfig();
        return this.config.refreshRate;
    }

    static getDevices() {
        if (this.config === {}) this.loadConfig();
        return this.config.devices;
    }

    static getTuyaConfig() {
        if (this.config === {}) this.loadConfig();
        return this.config.tuya;
    }

    static getSpotifyConfig() {
        if (this.config === {}) this.loadConfig();
        return this.config.spotify;
    }

    static getStartOnBoot() {
        if (this.config === {}) this.loadConfig();
        return this.config.startOnBoot;
    }
    
    static getPort() {
        if (this.config === {}) this.loadConfig();
        return this.config.port;
    }

    static getValue(key) {
        if (this.config === {}) this.loadConfig();
        return this.config[key];
    }
    
    static handleConfigActions(args) {
        const action = args[args.indexOf("config") + 1];
        if (!action || (action !== "set" && action !== "get")) return Logger.fatal("Invalid action provided. Please use `set` or `get`.");
        if (action === "set") {
            const key = args[args.indexOf("config") + 2];
            const value = args[args.indexOf("config") + 3];
            if (!key || !value) return Logger.fatal("Invalid key or value provided. Please provide a key and value.");
            if (Config.getValue(key) === undefined) return Logger.fatal("Invalid key provided. Please provide a valid key.");
            Config.setValue(key, value);
            Logger.info("Successfully set " + key + " to " + value + ".");
        } else if (action === "get") {
            const key = args[args.indexOf("config") + 2];
            if (!key) return Logger.fatal("Invalid key provided. Please provide a key.");
            const value = Config.getValue(key);
            if (value === undefined) return Logger.fatal("Invalid key provided. Please provide a valid key.");
            Logger.info("Value of " + key + " is " + value + ".");
        }
    }
    
    static enableEnv() {
        this.useEnv = true;
    }
}