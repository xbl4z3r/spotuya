import Logger from "./logger.js";
import path from "path";
import fs from "fs";
import PM2Provider from "./pm2provider.js";
import dotenv from "dotenv";
import {ConfigData, DeviceData} from "../@types/types";
import {getApplicationDirectory} from "./paths.js";

dotenv.config();

const CONFIG_FILE_NAME: string = 'config.json';
const DEFAULT_CONFIG: ConfigData = {
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
    configVersion: "2.1.1",
    refreshRate: 1000,
    startOnBoot: false,
    port: 4815,
    paletteMode: 0,
    cycleRate: 5000,
    contrastOffset: 0
}

export default class Config {
    static config: ConfigData;
    static configPath = '';
    static useEnv = false;

    static getConfigPath() {
        this.configPath = path.join(getApplicationDirectory(), CONFIG_FILE_NAME);
        if (!fs.existsSync(this.configPath)) fs.writeFileSync(this.configPath, JSON.stringify(DEFAULT_CONFIG, null, 4));
    }

    static initialize() {
        const startTime = new Date().getTime();
        if (this.useEnv) this.loadConfigFromEnv();
        else this.loadConfigFromDisk();
        Logger.debug(`Loaded config in ${new Date().getTime() - startTime}ms`);
    }

    static loadConfigFromEnv() {
        this.config = {
            devices: [],
            tuya: {
                clientId: process.env.TUYA_CLIENT_ID || "",
                clientSecret: process.env.TUYA_CLIENT_SECRET || "",
                region: process.env.TUYA_REGION || "",
                userId: process.env.TUYA_USER_ID || ""
            },
            spotify: {
                clientId: process.env.SPOTIFY_CLIENT_ID || "",
                clientSecret: process.env.SPOTIFY_CLIENT_SECRET || "",
                refreshToken: process.env.SPOTIFY_REFRESH_TOKEN || "",
                accessToken: "",
            },
            configVersion: process.env.CONFIG_VERSION || "2.1.0",
            refreshRate: parseInt(process.env.REFRESH_RATE || "1000"),
            startOnBoot: (process.env.START_ON_BOOT || "") as unknown as boolean || false,
            port: parseInt(process.env.PORT || "4815"),
            paletteMode: parseInt(process.env.PALETTE_MODE || "0"),
            cycleRate: parseInt(process.env.CYCLE_RATE || "5000"),
            contrastOffset: parseInt(process.env.CONTRAST_OFFSET || "0")
        };
        (process.env.DEVICES || "").split(',').forEach(device => {
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
        if (config === undefined) this.loadConfigFromDisk();

        const startTime = new Date().getTime();

        fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 4));

        Logger.debug(`Saved config in ${new Date().getTime() - startTime}ms`);
    }

    static cleanConfig() {
        Logger.debug('Cleaning config...');
        if (this.configPath === "") this.getConfigPath();
        fs.writeFileSync(this.configPath, JSON.stringify(DEFAULT_CONFIG, null, 4));
        this.config = DEFAULT_CONFIG;
        Logger.info("Successfully cleaned the configuration file.");
    }

    static addDevice(device: DeviceData) {
        if (this.config === undefined) this.initialize();
        let exists = false;
        this.config.devices.forEach(d => {
            if (d.id === device.id) exists = true;
        });
        if (exists) return Logger.warn(`Device ${device.name} already exists in config.`);
        Logger.debug(`Adding device ${device.name} to config...`);
        this.config.devices.push(device);
        this.saveConfig();
    }

    static addDevices(devices: DeviceData[]) {
        devices.forEach(device => {
            this.addDevice(device);
        });
    }

    static setTuyaConfig(config: ConfigData['tuya']) {
        if (this.config === undefined) this.initialize();
        Logger.debug(`Setting tuya config...`);
        this.config.tuya = config;
        this.saveConfig();
    }

    static setStartOnBoot(value: boolean) {
        if (this.config === undefined) this.initialize();
        Logger.debug(`Setting start on boot to ${value}...`);
        this.config.startOnBoot = value;
        if (value) PM2Provider.createTask();
        else PM2Provider.removeTask();
        this.saveConfig();
    }

    static setRefreshRate(value: number) {
        if (this.config === undefined) this.initialize();
        Logger.debug(`Setting refresh rate to ${value}...`);
        this.config.refreshRate = value;
        this.saveConfig();
    }

    static setConfigVersion(version: string) {
        if (this.config === undefined) this.initialize();
        Logger.debug(`Setting config version to ${version}...`);
        this.config.configVersion = version;
        this.saveConfig();
    }

    static setSpotifyConfig(config: ConfigData['spotify']) {
        if (this.config === undefined) this.initialize();
        Logger.debug(`Setting spotify config...`);
        this.config.spotify = config;
        this.saveConfig();
    }

    static setPort(port: number) {
        if (this.config === undefined) this.initialize();
        Logger.debug(`Setting port to ${port}...`);
        this.config.port = port;
        this.saveConfig();
    }

    static setPaletteMode(mode: number) {
        if (this.config === undefined) this.initialize();
        Logger.debug(`Setting palette mode to ${mode}...`);
        this.config.paletteMode = mode;
        this.saveConfig();
    }

    static setCycleRate(rate: number) {
        if (this.config === undefined) this.initialize();
        Logger.debug(`Setting cycle rate to ${rate}...`);
        this.config.cycleRate = rate;
        this.saveConfig();
    }

    static setContrastOffset(offset: number) {
        if (this.config === undefined) this.initialize();
        Logger.debug(`Setting contrast offset to ${offset}...`);
        this.config.contrastOffset = offset;
        this.saveConfig();
    }

    static setValue(key: string, value: object | string) {
        if (this.config === undefined) this.initialize();
        Logger.debug(`Setting ${key} to ${value}...`);
        // @ts-ignore
        this.config[key] = value;
        if (key === 'startOnBoot' && value) PM2Provider.createTask();
        else if (key === 'startOnBoot' && !value) PM2Provider.removeTask();
        this.saveConfig();
    }

    static getConfigVersion() {
        if (this.config === undefined) this.initialize();
        return this.config.configVersion;
    }

    static getRefreshRate() {
        if (this.config === undefined) this.initialize();
        return this.config.refreshRate;
    }

    static getDevices() {
        if (this.config === undefined) this.initialize();
        return this.config.devices;
    }

    static getTuyaConfig() {
        if (this.config === undefined) this.initialize();
        return this.config.tuya;
    }

    static getSpotifyConfig() {
        if (this.config === undefined) this.initialize();
        return this.config.spotify;
    }

    static getStartOnBoot() {
        if (this.config === undefined) this.initialize();
        return this.config.startOnBoot;
    }

    static getPort() {
        if (this.config === undefined) this.initialize();
        return this.config.port;
    }

    static getPaletteMode() {
        if (this.config === undefined) this.initialize();
        return this.config.paletteMode;
    }

    static getCycleRate() {
        if (this.config === undefined) this.initialize();
        return this.config.cycleRate;
    }

    static getContrastOffset() {
        if (this.config === undefined) this.initialize();
        return this.config.contrastOffset;
    }

    static getValue(key: string) {
        if (this.config === undefined) this.initialize();
        // @ts-ignore
        return this.config[key];
    }

    static handleConfigActions(args: string[]) {
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

    static isUsingEnv() {
        return this.useEnv;
    }
}