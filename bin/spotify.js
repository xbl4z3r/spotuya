import open from "open";
import express from "express";
import Logger from "./logger.js";

import path from 'path';
import {fileURLToPath} from 'url';
import inquirer from "inquirer";
import chalk from "chalk";
import Utils from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 4815
const SCOPE = [
    'user-read-playback-state',
    'user-read-currently-playing',
].join('%20')

const REDIRECT_URI = 'http://localhost:' + PORT + '/callback'

const app = express()

app.get('/callback', (req, res) => {
    res.sendFile(__dirname + '/callback.html');
    if (req.query.error) Logger.fatal("Error while logging in: " + req.query.error)
})

app.get('/token', (req, res) => {
    res.sendStatus(200)
    const token = req.query.access_token
    if (token) SpotifyAccessToken.accessToken = token;
})



export default class SpotifyAccessToken {
    static CLIENT_ID = "";
    static accessToken = "";

    static async setup() {
        return new Promise(async (resolve, reject) => {
            try {
                app.listen(PORT, () => {
                    Logger.debug("Started callback server on port " + PORT);
                    resolve();
                });
            } catch (e) {
                Logger.fatal("Error while setting up callback server... Make sure port " + PORT + " is not in use and try again.");
                reject();
            }
        })
    }

    static async getAccessToken() {
        await open('https://accounts.spotify.com/authorize'
            + '?client_id=' + this.CLIENT_ID
            + '&response_type=token'
            + '&scope=' + SCOPE
            + '&show_dialog=' + false
            + '&redirect_uri=' + REDIRECT_URI);
        return new Promise((resolve, reject) => {
            const interval = setInterval(() => {
                if (this.accessToken.length > 5) {
                    clearInterval(interval);
                    resolve(this.accessToken);
                }
            }, 1000);
        })
    }
}