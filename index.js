const config = require('./config.json');
const TuyAPI = require('tuyapi');
const SpotifyWebApi = require('spotify-web-api-node');
const Vibrant = require('node-vibrant')
const convert = require('color-convert');
const chalk = require('chalk');

if(config.spotify.client_id === undefined || config.spotify.client_secret === undefined) {
    console.log(chalk.red("Please add your Spotify client_id and client_secret to the config.json file."));
    process.exit(1);
}

if(config.devices === undefined) {
    console.log(chalk.red("Please add your devices to the config.json file."));
    process.exit(1);
}

if(config.refresh_interval === undefined) {
    console.log(chalk.red("Please add your refresh_interval to the config.json file."));
    process.exit(1);
}

if(config.debug === undefined) {
    console.log(chalk.red("Please add your debug to the config.json file."));
    process.exit(1);
}

// Create a new instance of the SpotifyWebApi object
const spotifyApi = new SpotifyWebApi({
    clientId: config.spotify.client_id,
    clientSecret: config.spotify.client_secret,
    scope: 'user-read-currently-playing user-read-playback-state', // spotify-token --scope user-read-currently-playing,user-read-playback-state
});

const hsvToHex = (h, s, v) => {
    // turn the contrast to the max
    if (s < 0.6) s += 0.25;
    let hexvalue = "";
    let hsvarray = [Math.round(h * 360), Math.round(s * 1000), Math.round(v * 1000)];
    for (let value of hsvarray) {
        let temp = value.toString(16).replace("0x", "");
        while (temp.length < 4) {
            temp = "0" + temp;
        }
        hexvalue += temp;
    }
    return hexvalue;
};

let killCheckerVar = false;
let setState = false;
let isPlaying = false;
let initialState = {
    powered: false,
    color: "010403200302"
}

if(config.spotify.access === undefined) {
    console.log(chalk.red("Please add your Spotify access token to the config.json file."));
    process.exit(1);
}

spotifyApi.setAccessToken(config.spotify.access);

if (config.spotify.refresh !== undefined) {
    spotifyApi.setRefreshToken(config.spotify.refresh);

    spotifyApi.refreshAccessToken().then(
        function (data) {
            if (data.statusCode !== 200) {
                console.log('Could not refresh access token', data);
                return;
            }
            if (config.debug) console.log('The access token has been refreshed!');

            // Save the access token so that it's used in future calls
            spotifyApi.setAccessToken(data.body['access_token']);
            spotifyApi.setRefreshToken(data.body['refresh_token']);
            config.spotify.access = data.body['access_token'];
            config.spotify.refresh = data.body['refresh_token'];
        },
        function (err) {
            console.log('Could not refresh access token', err);
        }
    );
}

const checkCurrentSong = (id) => {
    if(id === undefined) 
    {
        console.log(chalk.red("Internal error. Please contact the developer."));
        process.exit(1);
    }
    try {
        spotifyApi.getMyCurrentPlaybackState()
            .then(async function (data) {
                if (data.body.is_playing) {
                    isPlaying = true;
                    setState = false;
                    Vibrant.from(data.body.item.album.images[0].url).getPalette(async (err, palette) => {
                        killChecker();
                        // cycle through colors
                        if (config.debug) {
                            console.log(chalk.rgb(palette.Vibrant.getRgb()[0], palette.Vibrant.getRgb()[1], palette.Vibrant.getRgb()[2]).bold("Vibrant color: " + palette.Vibrant.getRgb()));
                            console.log(chalk.rgb(palette.DarkVibrant.getRgb()[0], palette.DarkVibrant.getRgb()[1], palette.DarkVibrant.getRgb()[2]).bold("DarkVibrant color: " + palette.DarkVibrant.getRgb()));
                            console.log(chalk.rgb(palette.LightVibrant.getRgb()[0], palette.LightVibrant.getRgb()[1], palette.LightVibrant.getRgb()[2]).bold("LightVibrant color: " + palette.LightVibrant.getRgb()));
                        }
                        const rgb = palette.Vibrant.getRgb();
                        const hsv = convert.rgb.hsv(rgb[0], rgb[1], rgb[2]);
                        const hexvalue = hsvToHex(hsv[0] / 360, hsv[1] / 100, hsv[2] / 100);
                        devices[id].set({
                            multiple: true,
                            data: {
                                '20': true,
                                '24': hexvalue,
                            },
                            shouldWaitForResponse: false
                        });
                    })

                } else {
                    isPlaying = false;
                    if (!setState) {
                        await startChecker(id);
                        setState = true;
                        devices[id].set({
                            multiple: true,
                            data: {
                                '20': initialState.powered,
                                '24': initialState.color,
                            },
                            shouldWaitForResponse: false
                        });
                    }
                }
                setTimeout(checkCurrentSong, config.refresh_interval);
            }, function (err) {
                console.log('Something went wrong!', err);
            });
    } catch (err) {
        console.log(err);
    }
}

const checker = (id) => {
    if (killCheckerVar) return;
    if (!isPlaying) {
        devices[id].get({ schema: true }).then(data => {
            initialState.powered = data.dps['20'];
            initialState.color = data.dps['24'];
        });
    }
    setTimeout(checker, 10 * refresh_interval);
}

const killChecker = () => {
    killCheckerVar = true;
}

const startChecker = (id) => {
    if(id === undefined) 
    {
        console.log(chalk.red("Internal error. Please contact the developer."));
        process.exit(1);
    }
    killCheckerVar = false;
    checker(id);
}

// go through each config.devices
// create a new instance of TuyAPI
// add it to the devices array
const devices = [];
for (let device of config.devices) {
    if (device.ip !== undefined && device.version !== undefined) {
        devices.push(new TuyAPI({
            id: device.id,
            key: device.key,
            ip: device.ip,
            version: device.version
        }));
    } else if (device.ip !== undefined) {
        devices.push(new TuyAPI({
            id: device.id,
            key: device.key,
            ip: device.ip
        }));
    } else if (device.version !== undefined) {
        devices.push(new TuyAPI({
            id: device.id,
            key: device.key,
            version: device.version
        }));
    } else if(device.id !== undefined && device.key !== undefined) {
        devices.push(new TuyAPI({
            id: device.id,
            key: device.key
        }));
    } else {
        console.log("Invalid device config");
        process.exit(1);
    }

    // Find device on network
    devices[devices.length - 1].find().then(() => {
        // Connect to device
        devices[devices.length - 1].connect();
    });

    // Add event listeners
    devices[devices.length - 1].on('connected', async () => {
        console.log('Connected to device!');
        startChecker(devices.length - 1);
        checkCurrentSong(devices.length - 1);
    });

    devices[devices.length - 1].on('disconnected', () => {
        if (config.debug) console.log('Disconnected from device.');
    });

    devices[devices.length - 1].on('error', error => {
        console.log('Error!', error);
    });

    devices[devices.length - 1].on('data', data => {
        if (config.debug) console.log('Data from device:', data);
    });
}