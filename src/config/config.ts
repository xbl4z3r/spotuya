import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import {ConfigData, DeviceData} from "../@types/types.js";
import Utils from "../utils/utils.js";
import Logger from "../utils/logger.js";
import AutoStartService from "../services/autostart.js";
import * as process from "node:process";

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
    configVersion: "",
    pollRate: 5000,
    pollMode: "dynamic",
    maxPollInterval: 20000,
    startOnBoot: false,
    port: 4815,
    paletteMode: 0,
    cycleRate: 5000,
    contrastOffset: 0,
    outdatedConfigWarning: true,
    dataProvider: "spotify",
}

export default class Config {
    private static config: ConfigData;
    private static configPath = '';
    private static useEnv = false;

    static getConfigPath() {
        this.configPath = path.join(Utils.getApplicationDirectory(), CONFIG_FILE_NAME);
        DEFAULT_CONFIG.configVersion = Utils.getVersion();
        if (!fs.existsSync(this.configPath)) fs.writeFileSync(this.configPath, JSON.stringify(DEFAULT_CONFIG, null, 4));
    }

    static initialize() {
        const startTime = new Date().getMilliseconds();
        if (this.useEnv) this.loadConfigFromEnv();
        else this.loadConfigFromDisk();
        Logger.debug(`Loaded config in ${new Date().getMilliseconds() - startTime}ms`);
    }

    static loadConfigFromEnv() {
        this.config = {
            devices: (process.env.DEVICES || "").split(',').map(device => {
                return {
                    id: device,
                    name: "Device",
                    key: "unknown"
                }
            }),
            tuya: {
                clientId: process.env.TUYA_CLIENT_ID || "",
                clientSecret: process.env.TUYA_CLIENT_SECRET || "",
                region: (process.env.TUYA_REGION || "").toLowerCase(),
                userId: process.env.TUYA_USER_ID || ""
            },
            spotify: {
                clientId: process.env.SPOTIFY_CLIENT_ID || "",
                clientSecret: process.env.SPOTIFY_CLIENT_SECRET || "",
                refreshToken: process.env.SPOTIFY_REFRESH_TOKEN || "",
                accessToken: "",
            },
            configVersion: process.env.CONFIG_VERSION || Utils.getVersion(),
            pollRate: parseInt(process.env.REFRESH_RATE || "5000"),
            pollMode: process.env.DATA_PROVIDER ? process.env.DATA_PROVIDER.toLowerCase() === "static" ?
                "static" : "dynamic" : "dynamic",
            maxPollInterval: parseInt(process.env.MAX_POLL_INTERVAL || "20000"),
            startOnBoot: (process.env.START_ON_BOOT || "") as unknown as boolean || false,
            port: parseInt(process.env.PORT || "4815"),
            paletteMode: parseInt(process.env.PALETTE_MODE || "0"),
            cycleRate: parseInt(process.env.CYCLE_RATE || "5000"),
            contrastOffset: parseInt(process.env.CONTRAST_OFFSET || "0"),
            outdatedConfigWarning: (process.env.OUTDATED_CONFIG_WARNING || "") as unknown as boolean || true,
            dataProvider: process.env.DATA_PROVIDER ? process.env.DATA_PROVIDER.toLowerCase() === "spotify" ?
                "spotify" : new URL(process.env.DATA_PROVIDER.toLowerCase()) : "spotify",
        };
    }

    static loadConfigFromDisk() {
        if (this.configPath === '') this.getConfigPath();
        this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
    }

    static saveConfig() {
        if (this.useEnv) return Logger.warn("Cannot save config when using environment variables.");
        fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 4));
    }

    static cleanConfig() {
        Logger.debug('Cleaning config...');
        if (this.configPath === "") this.getConfigPath();
        DEFAULT_CONFIG.configVersion = Utils.getVersion();
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
        if (value) AutoStartService.createTask();
        else AutoStartService.removeTask();
        this.saveConfig();
    }

    static setPollRate(value: number) {
        if (this.config === undefined) this.initialize();
        Logger.debug(`Setting refresh rate to ${value}...`);
        this.config.pollRate = value;
        this.saveConfig();
    }

    static setPollMode(mode: "static" | "dynamic") {
        if (this.config === undefined) this.initialize();
        Logger.debug(`Setting poll mode to ${mode}...`);
        this.config.pollMode = mode;
        this.saveConfig();
    }

    static setMaxPollInterval(value: number) {
        if (this.config === undefined) this.initialize();
        Logger.debug(`Setting max poll interval to ${value}...`);
        this.config.maxPollInterval = value;
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
        if (key === 'startOnBoot' && value) AutoStartService.createTask();
        else if (key === 'startOnBoot' && !value) AutoStartService.removeTask();
        this.saveConfig();
    }

    static setOutdatedConfigWarning(value: boolean) {
        if (this.config === undefined) this.initialize();
        Logger.debug(`Setting outdated config warning to ${value}...`);
        this.config.outdatedConfigWarning = value;
        this.saveConfig();
    }

    static setDataProvider(provider: "spotify" | URL) {
        if (this.config === undefined) this.initialize();
        Logger.debug(`Setting data provider to ${provider}...`);
        this.config.dataProvider = provider;
        this.saveConfig();
    }

    static getConfigVersion() {
        if (this.config === undefined) this.initialize();
        return this.config.configVersion;
    }

    static getPollRate() {
        if (this.config === undefined) this.initialize();
        return this.config.pollRate;
    }

    static getPollMode() {
        if (this.config === undefined) this.initialize();
        return this.config.pollMode;
    }

    static getMaxPollInterval() {
        if (this.config === undefined) this.initialize();
        return this.config.maxPollInterval;
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

    static getOutdatedConfigWarning() {
        if (this.config === undefined) this.initialize();
        return this.config.outdatedConfigWarning;
    }

    static getDataProvider() {
        if (this.config === undefined) this.initialize();
        return this.config.dataProvider;
    }

    static getConfigKeys() {
        if (this.config === undefined) this.initialize();
        return Object.keys(this.config);
    }

    static enableEnv() {
        this.useEnv = true;
    }

    static isUsingEnv() {
        return this.useEnv;
    }
}