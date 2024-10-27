import open from "open";
import express from "express";
import request from "request";

import Logger from "./logger.js";
import Utils from "./utils.js";
import SpotifyWebApi from "spotify-web-api-node";
import Config from "./config.js";

const PORT = Config.getPort();
const SCOPE = [
    'user-read-playback-state',
    'user-read-currently-playing',
].join('%20')

const REDIRECT_URI = 'http://localhost:' + PORT + '/callback'

const app = express()

app.get('/callback', (req, res) => {
    const code = req.query.code || null;
    const state = req.query.state || null;

    if (state === null) {
        Logger.error("State is null");
    } else {
        const authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                code: code,
                redirect_uri: REDIRECT_URI,
                grant_type: 'authorization_code'
            },
            headers: {
                'Authorization': 'Basic ' + (new Buffer.from(SpotifyTokenStore.CLIENT_ID + ':' + SpotifyTokenStore.CLIENT_SECRET).toString('base64'))
            },
            json: true
        };

        request.post(authOptions, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                const access_token = body.access_token,
                    refresh_token = body.refresh_token;

                res.redirect('/token' +
                    '?access_token=' + access_token +
                    '&refresh_token=' + refresh_token);
            } else {
                Logger.fatal("Error while getting access token. Check your config file and try again.");
            }
        });
    }
})

app.get('/token', (req, res) => {
    const accessToken = req.query.access_token
    const refreshToken = req.query.refresh_token
    if (refreshToken) SpotifyTokenStore.refreshToken = refreshToken
    if (accessToken) SpotifyTokenStore.accessToken = accessToken;
    res.send('<script>window.close()</script>')
})

export class SpotifyTokenStore {
    static CLIENT_ID = "";
    static CLIENT_SECRET = "";
    static accessToken = "";
    static refreshToken = "";

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
        return new Promise(async (resolve) => {
            if (this.refreshToken.length > 5) {
                Logger.debug("Logging in with refresh token...");
                const authOptions = {
                    url: 'https://accounts.spotify.com/api/token',
                    headers: {'Authorization': 'Basic ' + (Buffer.from(SpotifyTokenStore.CLIENT_ID + ':' + SpotifyTokenStore.CLIENT_SECRET).toString('base64'))},
                    form: {
                        grant_type: 'refresh_token',
                        refresh_token: this.refreshToken
                    },
                    json: true
                };
                request.post(authOptions, function (error, response, body) {
                    if (!error && response.statusCode === 200) {
                        SpotifyTokenStore.accessToken = body.access_token;
                        if (body.refresh_token) SpotifyTokenStore.refreshToken = body.refresh_token
                        const response = {
                            accessToken: SpotifyTokenStore.accessToken,
                            refreshToken: SpotifyTokenStore.refreshToken
                        }
                        resolve(response);
                    }
                });
            } else {
                Logger.debug("Requesting new access token...");
                await open('https://accounts.spotify.com/authorize'
                    + '?client_id=' + this.CLIENT_ID
                    + '&response_type=code'
                    + '&scope=' + SCOPE
                    + '&show_dialog=' + false
                    + '&redirect_uri=' + REDIRECT_URI
                    + '&state=' + Utils.generateRandomString(16)
                );
                const interval = setInterval(() => {
                    if (this.accessToken.length > 5) {
                        clearInterval(interval);
                        const response = {
                            accessToken: this.accessToken,
                            refreshToken: this.refreshToken
                        }
                        resolve(response);
                    }
                }, 1000);
            }
        })
    }

    static setClientId(clientId) {
        this.CLIENT_ID = clientId;
    }

    static setClientSecret(clientSecret) {
        this.CLIENT_SECRET = clientSecret;
    }

    static setRefreshToken(refreshToken) {
        this.refreshToken = refreshToken;
    }
}

export class SpotifyPlaybackStore {
    static isPlaying = false;
    
    static setPlaying(playing) {
        this.isPlaying = playing;
    }
    
    static getPlaying() {
        return this.isPlaying;
    }
}

export class SpotifyApiProvider {
    spotifyApi
    static instance = new SpotifyApiProvider();
    
    static initialize(clientId, clientSecret, accessToken = null) {
        SpotifyApiProvider.instance.spotifyApi = new SpotifyWebApi({
            clientId: clientId,
            clientSecret: clientSecret,
            scope: 'user-read-currently-playing user-read-playback-state',
        });
        if (accessToken) SpotifyApiProvider.setAccessToken(accessToken);
    }
    
    static setAccessToken(accessToken) {
        SpotifyApiProvider.instance.spotifyApi.setAccessToken(accessToken);
    }
    
    static getApi() {
        return SpotifyApiProvider.instance.spotifyApi;
    }
}