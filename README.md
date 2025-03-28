# SpoTuya

[![Run on Repl.it](https://replit.com/badge/github/xbl4z3r/spotuya)](https://replit.com/new/github/xbl4z3r/spotuya)

SpoTuya, formerly known as Spotify-Tuya, is a simple background process script to change the color of your Tuya lights
based on the cover art
of the song you're listening to on Spotify. It is written in TypeScript (as of 2.1.1) and is easy to set up. SpoTuya uses
the [Tuya API](https://developer.tuya.com/en/docs/cloud/cloudapi?id=K9i5ql6waswzq) to control the lights and
the [Spotify Web API](https://developer.spotify.com/documentation/web-api/) to get the cover art of the song you're
listening to. SpoTuya is a fun project that I created to learn more about the Tuya and Spotify APIs and to have a cool
feature in my room. I hope you enjoy it as much as I do and remember to leave a star!
<br>

## Cloud API

Starting from version 2.0.0, SpoTuya has been rewritten to use the Tuya Cloud API instead of the Tuya Local API. This
means that you no longer need to be on the same network as your Tuya devices to control them. This also means that you
can control your devices from anywhere in the world as long as you have an internet connection. The setup process has
remained the same, but the way SpoTuya works has changed. You can now use .env files to store your credentials to
make running SpoTuya in the cloud easier. Please refer to `example.env` for an example of how to set up your .env file.
<br>

## Features

The latest version of SpoTuya supports the following features:

- [x] Change the color of your Tuya lights based on the cover art of the song you're listening to on Spotify.
- [x] Change the color of multiple lights at the same time.
- [x] Automatically reconnect to Spotify when the access token expires.
- [x] Start SpoTuya on system startup.
- [x] Cloud API support.
- [x] Support for multiple devices.
- [x] Specific color palettes. (Vibrant, Dark Vibrant, Dark Muted, Muted)
- [ ] Web interface.
- [ ] Support for more devices.
- [ ] Support for more music streaming services.
- [ ] Support for more color palettes.
- [ ] Support for more light effects.
  <br>

## Installation

To install SpoTuya clone this repository and run `npm install -g .`. This will install the CLI globally on your machine.
You can also install it locally by running `npm install .`.
<br>

## Setup

To set up SpoTuya you just have to run `spotuya setup` or `spotuya wizard` and follow the instructions. You will be
asked
to provide a Tuya ID, a Tuya Secret and (sometimes) a single device's virtual ID. You can find the Tuya ID and Secret in
the [Tuya Developer Console](https://iot.tuya.com/cloud). The virtual ID can be found under the devices tab in the
project console. Remember that you first need to add your devices to the project via the Tuya Smart app before running
the SpoTuya wizard. After all that information has been provided, the wizard will ask for a Spotify Application ID and
Secret and open a Spotify OAuth2 page where you will be asked to log in and authorize the application.<br>
If you want to use SpoTuya in the cloud, you can create a `.env` file in the root directory of the project based on the
`example.env` file. You will most likely need to run `spotuya setup` at least once to get your needed credentials from
your usual config file.
<br>

## Usage

To use SpoTuya you just have to run the command `spotuya start` and it will start listening for Spotify events. You can
also run `spotuya help` to see all the available commands.
<br>

## Contributing

To contribute to this project, you can follow these steps:

1. Fork the repository to your own account.
2. Clone the forked repository to your local machine.
3. Create a new branch for your changes.
4. Make your changes and commit them with a clear and concise commit message.
5. Push your changes to your forked repository.
6. Create a pull request to the original repository and describe your changes.

Please make sure to follow the project's coding style and guidelines when making changes. Also, be sure to test your
changes thoroughly before submitting a pull request.
