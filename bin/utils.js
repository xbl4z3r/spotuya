import chalk from "chalk";

export default class Utils {
    static SPOTIFY_COLOR = "#1DB954";
    static CREDENTIAL_QUESTIONS = [
        {
            name: 'clientId',
            message: 'The Spotify Application client ID:',
            prefix: chalk.hex(Utils.SPOTIFY_COLOR)("[SpoTuya - " + new Date().toLocaleTimeString('en-US', {hour12: false}) + "]")
        },
        {
            name: 'clientSecret',
            message: 'The Spotify Application client secret:',
            prefix: chalk.hex(Utils.SPOTIFY_COLOR)("[SpoTuya - " + new Date().toLocaleTimeString('en-US', {hour12: false}) + "]")
        }
    ];
    static TUYA_API_QUESTIONS = [
        {
            name: 'apiKey',
            message: 'The API key from iot.tuya.com/cloud:',
            prefix: chalk.hex(Utils.SPOTIFY_COLOR)("[SpoTuya - " + new Date().toLocaleTimeString('en-US', {hour12: false}) + "]")
        },
        {
            name: 'apiSecret',
            message: 'The API secret from iot.tuya.com/cloud',
            prefix: chalk.hex(Utils.SPOTIFY_COLOR)("[SpoTuya - " + new Date().toLocaleTimeString('en-US', {hour12: false}) + "]")
        }
    ];
    static hsvToHex = (h, s, v) => {
        // turn the contrast to the max
        if (s < 0.6) s += 0.25;
        let hex_value = "";
        let hsv_array = [Math.round(h * 360), Math.round(s * 1000), Math.round(v * 1000)];
        for (let value of hsv_array) {
            let temp = value.toString(16).replace("0x", "");
            while (temp.length < 4) {
                temp = "0" + temp;
            }
            hex_value += temp;
        }
        return hex_value;
    };
}