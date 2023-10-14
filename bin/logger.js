import chalk from "chalk";
import Utils from "./utils.js";

export default class Logger {
    static debugMode = false;
    static info(message) {
        console.log(chalk.hex(Utils.SPOTIFY_COLOR)("[SpoTuya - " + new Date().toLocaleTimeString('en-US', { hour12: false }) + "] ") + message);
    }

    static warn(message) {
        console.log(chalk.hex("#FFA500")("[SpoTuya - " + new Date().toLocaleTimeString('en-US', {hour12: false }) + "] ") + message);
    }

    static error(message) {
        console.log(chalk.hex("#FF0000")("[SpoTuya - " + new Date().toLocaleTimeString('en-US', { hour12: false }) + "] ") + message);
    }

    static fatal(message) {
        console.log(chalk.hex("#FF0000")("[SpoTuya - " + new Date().toLocaleTimeString('en-US', { hour12: false }) + "] ") + message);
        process.exit(1);
    }

    static debug(message) {
        if(this.debugMode) console.log(chalk.hex("#ff00dd")("[SpoTuya - " + new Date().toLocaleTimeString('en-US', { hour12: false }) + "] ") + message);
    }

    static setDebugMode(mode) {
        this.debugMode = mode;
    }
}