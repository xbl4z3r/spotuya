import express from "express";
import request from "request";
import {SpotifyTokenStore} from "../store/spotify-token-store.js";
import {SpotifyPlaybackStore} from "../store/spotify-playback-store.js";
import Logger from "../utils/logger.js";
import {StateStore} from "../store/state-store.js";
import Config from "../config/config.js";

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
                redirect_uri: 'http://localhost:' + (process.env.PORT || Config.getPort() || 4815) + '/callback',
                grant_type: 'authorization_code'
            },
            headers: {
                // @ts-ignore
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
    const accessToken = req.query.access_token as string
    const refreshToken = req.query.refresh_token as string
    if (refreshToken) SpotifyTokenStore.setRefreshToken(refreshToken);
    if (accessToken) SpotifyTokenStore.setAccessToken(accessToken);
    res.send('<script>window.close()</script>')
})

app.get('/', (req, res) => {
    res.json(SpotifyPlaybackStore.getNowPlaying());
})

app.get('/toggle', (req, res) => {
    if (StateStore.isEnabled()) {
        StateStore.disable()
    } else {
        StateStore.enable()
    }
    res.send('<script>window.close()</script>');
});

export class Webserver {
    static async initialize(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            const PORT = process.env.PORT || Config.getPort() || 4815;
            try {
                app.listen(PORT, () => {
                    Logger.debug("Started server on port " + PORT);
                    resolve();
                });
            } catch (e) {
                Logger.fatal("Error while setting up server... Make sure port " + PORT + " is not in use and try again.");
                reject();
            }
        })
    }
}