# Spotify Tuya
Spotify Tuya is a simple script to change the color of your Tuya lights based on the album art of the song you're listening to on Spotify. It is written in JavaScript and is easy to set up. It's using `tuyapi` package and it's currently set to work with Light Devices Type B (data should be structured from 20 to 24).<br>
<br>
## Set-up
You will need to edit the `config.json` to match your devices & Spotify account. <br>
<br>
To set up Spotify you will need a developer app in the Spotify for Developers portal. You will then have a Client ID and a Client Secret. Replace the default value in the `config.json` with the information provided by Spotify. Next up you will need to supply the config with an access token and a refresh token. You can use a tool like `@spotifly/auth-token
` to get both of the tokens or a tool like `spotify-token` to get only the access token in case you get an expired access token error. Please make sure that the tokens are generated with the scopes: `user-read-currently-playing` and `user-read-playback-state`.<br>
<br>
To set up Tuya devices there are a couple of ways and the `tuyapi` has a good tutorial on how to get the device ID and Key. The IP needs to be the device's local IP if you want to use it, but it isn't necessary. The version number tells the program how to decrypt and call events on your device. The default version number is 3.1 and it will use that unless specified otherwise.<br>
<br>
## Common Errors
One of the most common errors is `401: Token expired`. If you get this error try supplying the `config.json` with a new access token generated via a tool like `spotify-token`. Please make sure that the token is generated with the scopes: `user-read-currently-playing` and `user-read-playback-state`.<br>
<br>
For any errors related to Tuya Devices please make sure that the devices are powered and have been assigned the correct version number. Also please note that for now we only support Light Devices Type B (data should be structured from 20 to 24).<br>
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