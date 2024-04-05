import Logger from "./logger.js";
import os from "os";
import path from "path";
import fs from "fs";
import Utils from "./utils.js";
import PM2Provider from "./pm2provider.js";

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
    refreshRate: 1000,
    startOnBoot: false
}

export default class Config {

    static config = {};
    static configPath = '';

    static getConfigPath(shouldClean = false) {
        // if on windows check for %appdata%/spotuya/config.json
        // if on linux check for ~/.config/spotuya/config.json
        // if on mac check for ~/Library/Application Support/spotuya/config.json
        this.configPath = Utils.getApplicationDirectory()
        switch (os.platform()) {
            case 'win32':
                this.configPath = path.join(this.configPath, CONFIG_FILE_NAME);
                if (!fs.existsSync(this.configPath)) fs.writeFileSync(this.configPath, JSON.stringify(DEFAULT_CONFIG, null, 4));
                break;
            case 'linux':
                this.configPath = path.join(this.configPath, CONFIG_FILE_NAME);
                if (!fs.existsSync(this.configPath)) fs.writeFileSync(this.configPath, JSON.stringify(DEFAULT_CONFIG, null, 4));
                break;
            case 'darwin':
                this.configPath = path.join(this.configPath, CONFIG_FILE_NAME);
                if (!fs.existsSync(this.configPath)) fs.writeFileSync(this.configPath, JSON.stringify(DEFAULT_CONFIG, null, 4));
                break;
            case "android":
                this.configPath = path.join(this.configPath, CONFIG_FILE_NAME);
                if (!fs.existsSync(this.configPath)) fs.writeFileSync(this.configPath, JSON.stringify(DEFAULT_CONFIG, null, 4));
                break;
            default:
                Logger.fatal('Unsupported platform');
        }
    }

    static loadConfigFromDisk() {
        const startTime = new Date().getTime();
        if (this.configPath === '') this.getConfigPath();

        const config = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));

        Logger.debug(`Loaded config in ${new Date().getTime() - startTime}ms`);
        this.config = config;
    }

    static saveConfig(config = undefined) {
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
    }

    static addDevice(device) {
        if (this.config === {}) this.loadConfigFromDisk();
        Logger.debug(`Adding device ${device.name} to config...`);
        this.config.devices.push(device);
        this.saveConfig();
    }

    static setStartOnBoot(value) {
        if (this.config === {}) this.loadConfigFromDisk();
        Logger.debug(`Setting start on boot to ${value}...`);
        this.config.startOnBoot = value;
        if (value) PM2Provider.createTask();
        else PM2Provider.removeTask();
        this.saveConfig();
    }

    static setRefreshRate(value) {
        if (this.config === {}) this.loadConfigFromDisk();
        Logger.debug(`Setting refresh rate to ${value}...`);
        this.config.refreshRate = value;
        this.saveConfig();
    }

    static setConfigVersion(version) {
        if (this.config === {}) this.loadConfigFromDisk();
        Logger.debug(`Setting config version to ${version}...`);
        this.config.configVersion = version;
        this.saveConfig();
    }

    static setSpotifyConfig(config) {
        if (this.config === {}) this.loadConfigFromDisk();
        Logger.debug(`Setting spotify config...`);
        this.config.spotify = config;
        this.saveConfig();
    }

    static setValue(key, value) {
        if (this.config === {}) this.loadConfigFromDisk();
        Logger.debug(`Setting ${key} to ${value}...`);
        this.config[key] = value;
        if (key === 'startOnBoot' && value) PM2Provider.createTask();
        else if (key === 'startOnBoot' && !value) PM2Provider.removeTask();
        this.saveConfig();
    }

    static getConfigVersion() {
        if (this.config === {}) this.loadConfigFromDisk();
        return this.config.configVersion;
    }

    static getRefreshRate() {
        if (this.config === {}) this.loadConfigFromDisk();
        return this.config.refreshRate;
    }

    static getDevices() {
        if (this.config === {}) this.loadConfigFromDisk();
        return this.config.devices;
    }

    static getSpotifyConfig() {
        if (this.config === {}) this.loadConfigFromDisk();
        return this.config.spotify;
    }

    static getStartOnBoot() {
        if (this.config === {}) this.loadConfigFromDisk();
        return this.config.startOnBoot;
    }

    static getValue(key) {
        if (this.config === {}) this.loadConfigFromDisk();
        return this.config[key];
    }
}