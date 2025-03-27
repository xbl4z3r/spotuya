import chalk from "chalk";

export const SCOPE = [
    'user-read-playback-state',
    'user-read-currently-playing',
].join('%20')

export const SPOTIFY_COLOR = "#1DB954";

export const CREDENTIAL_QUESTIONS = [
    {
        name: 'clientId',
        message: 'The Spotify Application client ID:',
        prefix: chalk.hex(SPOTIFY_COLOR)("[SpoTuya - " + new Date().toLocaleTimeString('en-US', {hour12: false}) + "]")
    },
    {
        name: 'clientSecret',
        message: 'The Spotify Application client secret:',
        prefix: chalk.hex(SPOTIFY_COLOR)("[SpoTuya - " + new Date().toLocaleTimeString('en-US', {hour12: false}) + "]")
    }
];

export const TUYA_API_QUESTIONS = [
    {
        name: 'clientId',
        message: 'The Client ID from iot.tuya.com/cloud:',
        prefix: chalk.hex(SPOTIFY_COLOR)("[SpoTuya - " + new Date().toLocaleTimeString('en-US', {hour12: false}) + "]")
    },
    {
        name: 'clientSecret',
        message: 'The Client Secret from iot.tuya.com/cloud',
        prefix: chalk.hex(SPOTIFY_COLOR)("[SpoTuya - " + new Date().toLocaleTimeString('en-US', {hour12: false}) + "]")
    }
];

export const GENERAL_QUESTIONS = [
    {
        name: 'refreshRate',
        message: 'The refresh rate in milliseconds (default: 5000):',
        prefix: chalk.hex(SPOTIFY_COLOR)("[SpoTuya - " + new Date().toLocaleTimeString('en-US', {hour12: false}) + "]"),
        default: 5000
    },
    {
        name: 'startOnBoot',
        message: '(INFO: This will install and use PM2) Start SpoTuya on boot (y/n):',
        prefix: chalk.hex(SPOTIFY_COLOR)("[SpoTuya - " + new Date().toLocaleTimeString('en-US', {hour12: false}) + "]"),
        default: "n"
    },
    {
        name: 'port',
        message: 'The port to run Spotify callbacks on (default: 4815):',
        prefix: chalk.hex(SPOTIFY_COLOR)("[SpoTuya - " + new Date().toLocaleTimeString('en-US', {hour12: false}) + "]"),
        default: 4815
    },
    {
        name: 'colorPalette',
        message: 'The color palette to use (-1: Cycle, 0: Vibrant, 1: DarkVibrant, 2: LightVibrant, 3: Muted, 4: DarkMuted, 5: LightMuted) (default: 0):',
        prefix: chalk.hex(SPOTIFY_COLOR)("[SpoTuya - " + new Date().toLocaleTimeString('en-US', {hour12: false}) + "]"),
        default: 0
    },
    {
        name: 'cycleRate',
        message: 'The cycle rate in milliseconds (default: 5000):',
        prefix: chalk.hex(SPOTIFY_COLOR)("[SpoTuya - " + new Date().toLocaleTimeString('en-US', {hour12: false}) + "]"),
        default: 5000
    },
    {
        name: 'contrastOffset',
        message: 'The contrast offset (default: 0, between -100 and 100):',
        prefix: chalk.hex(SPOTIFY_COLOR)("[SpoTuya - " + new Date().toLocaleTimeString('en-US', {hour12: false}) + "]"),
        default: 0
    }
];