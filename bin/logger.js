import chalk from "chalk";
import Utils from "./utils.js";
import fs from "fs";
import path from "node:path";

export default class Logger {
    static debugMode = false;
    static logFilePath = "not_initialized";

    static initialize() {
        const date = new Date();
        try {
            const logFileName = `SpoTuya-${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}.log`;
            if (!fs.existsSync(path.join(Utils.getApplicationDirectory(), "logs"))) fs.mkdirSync(path.join(Utils.getApplicationDirectory(), "logs"));
            const logFilePath = path.join(Utils.getApplicationDirectory(), "logs", logFileName);
            if (!fs.existsSync(logFilePath)) fs.writeFileSync(logFilePath, "");
            this.logFilePath = logFilePath;
        } catch (e) {
            this.error("Failed to initialize log file: " + e);
            this.logFilePath = "not_initialized";
        }
    }

    static info(message) {
        console.log(chalk.hex(Utils.SPOTIFY_COLOR)("[SpoTuya - " + new Date().toLocaleTimeString('en-US', {hour12: false}) + "] ") + message);
        if (this.logFilePath !== "not_initialized") fs.appendFileSync(this.logFilePath, `[INFO] ${message}\n`);
    }

    static warn(message) {
        console.log(chalk.hex("#FFA500")("[SpoTuya - " + new Date().toLocaleTimeString('en-US', {hour12: false}) + "] ") + message);
        if (this.logFilePath !== "not_initialized") fs.appendFileSync(this.logFilePath, `[WARN] ${message}\n`);
    }

    static error(message) {
        console.log(chalk.hex("#FF0000")("[SpoTuya - " + new Date().toLocaleTimeString('en-US', {hour12: false}) + "] ") + message);
        if (this.logFilePath !== "not_initialized") fs.appendFileSync(this.logFilePath, `[ERROR] ${message}\n`);
    }

    static fatal(message) {
        console.log(chalk.hex("#FF0000")("[SpoTuya - " + new Date().toLocaleTimeString('en-US', {hour12: false}) + "] ") + message);
        if (this.logFilePath !== "not_initialized") fs.appendFileSync(this.logFilePath, `[FATAL] ${message}\n`);
        process.exit(1);
    }

    static debug(message) {
        if (this.debugMode) console.log(chalk.hex("#ff00dd")("[SpoTuya - " + new Date().toLocaleTimeString('en-US', {hour12: false}) + "] ") + message);
        if (this.logFilePath !== "not_initialized") fs.appendFileSync(this.logFilePath, `[DEBUG] ${message}\n`);
    }

    static setDebugMode(mode) {
        this.debugMode = mode;
    }
}