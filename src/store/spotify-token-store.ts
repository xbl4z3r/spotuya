import request from "request";
import open from "open";
import {SCOPE} from "../utils/constants.js";
import Logger from "../utils/logger.js";
import Utils from "../utils/utils.js";
import Config from "../config/config.js";

export class SpotifyTokenStore {
    static CLIENT_ID = "";
    static CLIENT_SECRET = "";
    static accessToken = "";
    static refreshToken = "";

    static async getAccessToken(): Promise<{
        access_token: string,
        refresh_token: string
    }> {
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
                            access_token: SpotifyTokenStore.accessToken,
                            refresh_token: SpotifyTokenStore.refreshToken
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
                    + '&redirect_uri=' + 'http://localhost:' + (process.env.PORT || Config.getPort() || 4815) + '/callback'
                    + '&state=' + Utils.generateRandomString(16)
                );
                const interval = setInterval(() => {
                    if (this.accessToken.length > 5) {
                        clearInterval(interval);
                        const response = {
                            access_token: this.accessToken,
                            refresh_token: this.refreshToken
                        }
                        resolve(response);
                    }
                }, 1000);
            }
        })
    }

    static setClientId(clientId: string) {
        this.CLIENT_ID = clientId;
    }

    static setClientSecret(clientSecret: string) {
        this.CLIENT_SECRET = clientSecret;
    }

    static setRefreshToken(refreshToken: string) {
        this.refreshToken = refreshToken;
    }
}