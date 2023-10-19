# SpoTuya
SpoTuya, formerly known as Spotify-Tuya, is a simple CLI to change the color of your Tuya lights based on the cover art of the song you're listening to on Spotify. It is written in JavaScript and is easy to set up. It's using `tuyapi` package and it's currently set to work with Light Devices Type B (data should be structured from 20 to 24). I'm planning to add support for all device types later.<br>
<br>
## Installation
To install SpoTuya clone this repository and run `npm install -g .`. This will install the CLI globally on your machine. You can also install it locally by running `npm install .`.<br>
<br>
## Features
The latest version of SpoTuya supports the following features:
- [x] Change the color of your Tuya lights based on the cover art of the song you're listening to on Spotify.
- [x] Change the color of multiple lights at the same time.
- [x] Automatically reconnect to Spotify when the access token expires.
- [ ] Start SpoTuya on system startup.
<br>

## Setup
To setup SpoTuya you just have to run `spotuya setup` or `spotuya wizard` and follow the instructions. You will be asked to provide a Tuya ID, a Tuya Secret and (sometimes) a single device's virtual ID. You can find the Tuya ID and Secret in the [Tuya Developer Console](https://iot.tuya.com/cloud). The virtual ID can be found under the devices tab in the project console. Remember that you first need to add your devices to the project via the Tuya Smart app before running the SpoTuya wizard. After all that information has been provided, the wizard will ask for a Spotify Application ID and Secret and open a Spotify OAuth2 page where you will be asked to login and authorize the application.<br>
<br>
## Usage
To use SpoTuya you just have to run the command `spotuya start` and it will start listening for Spotify events. You can also run `spotuya help` to see all the available commands.<br>
<br>
## Contributing
To contribute to this project, you can follow these steps:

1. Fork the repository to your own account.
2. Clone the forked repository to your local machine.
3. Create a new branch for your changes.
4. Make your changes and commit them with a clear and concise commit message.
5. Push your changes to your forked repository.
6. Create a pull request to the original repository and describe your changes.

Please make sure to follow the project's coding style and guidelines when making changes. Also, be sure to test your changes thoroughly before submitting a pull request.
