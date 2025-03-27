import Config from "./config.js";
import express from "express";
import Logger from "./logger.js";
import request from "request";
import {SpotifyPlaybackStore, SpotifyTokenStore} from "./spotify.js";

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
                redirect_uri: 'http://localhost:' + Config.getPort() || process.env.PORT || 4815 + '/callback',
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
    if (refreshToken) SpotifyTokenStore.refreshToken = refreshToken
    if (accessToken) SpotifyTokenStore.accessToken = accessToken;
    res.send('<script>window.close()</script>')
})

app.get('/', (req, res) => {
    res.send(
        `Enabled: ${StateController.isEnabled()}<br>` +
        `Playing: ${SpotifyPlaybackStore.getPlaying()}<br>` +
        `Song name: ${SpotifyPlaybackStore.getSongName()}<br>` +
        `Artist name: ${SpotifyPlaybackStore.getArtistName()}<br>` +
        `Album name: ${SpotifyPlaybackStore.getAlbumName()}<br>` +
        `Album art: ${SpotifyPlaybackStore.getImageUrl()}<br>` +
        `Progress: ${SpotifyPlaybackStore.getProgress()}<br>` +
        `Toggle: <button onclick="fetch('/toggle')">Toggle</button><br>`
    )
})

app.get('/toggle', (req, res) => {
    if (StateController.isEnabled()) {
        StateController.disable()
    } else {
        StateController.enable()
    }
    res.send('<script>window.close()</script>');
});

export class WebserverProvider {
    static async initialize(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            const PORT = Config.getPort() || process.env.PORT || 4815;
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

export class StateController {
    static enabled = true;

    static isEnabled() {
        return this.enabled;
    }

    static enable() {
        this.enabled = true;
    }

    static disable() {
        this.enabled = false;
    }
}