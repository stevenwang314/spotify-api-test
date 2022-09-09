require('dotenv').config({ path: "secret.env" });
const cors = require('cors');
const express = require("express");
const axios = require("axios");
const serverless = require('serverless-http');

const app = express();
//const host = 'localhost';
//const port = 6969;
let bodyParser = require('body-parser');
const router = express.Router();

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/.netlify/functions/server', router);  // path must route to lambda (express/server.js)

axios.defaults.baseURL = 'https://accounts.spotify.com';

/*const server = http.createServer(app);
server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});*/

app.get('/authorize', function (req, res) {
    let str = 'https://accounts.spotify.com/authorize?' + serialize(
        {
            client_id: process.env.CLIENT_ID,
            response_type: 'code',
            redirect_uri: process.env.REDIRECT_URI,
            scope: `ugc-image-upload user-modify-playback-state 
        user-read-playback-state user-read-currently-playing 
        user-follow-modify user-follow-read user-read-recently-played user-top-read
        playlist-read-collaborative playlist-modify-public playlist-read-private playlist-modify-private
        app-remote-control streaming user-read-email user-read-private user-library-modify user-library-read`

        });

    res.redirect(str);
});

app.post('/connect', async function (req, res) {
    //Only get key is the refresh token has expired.
    if (req.body["refresh_token"] === null) {
        //Form needs to be urlencoded since our content-type is set to urlencoded
        var urlencoded = new URLSearchParams();
        urlencoded.append("grant_type", "authorization_code");
        urlencoded.append("code", req.body.authCode);
        urlencoded.append("redirect_uri", process.env.REDIRECT_URI);

        axios.post('/api/token', urlencoded,
            {
                headers: {
                    "Authorization": 'Basic ' + Buffer.from(process.env.CLIENT_ID + ':' + process.env.CLIENT_SECRET).toString('base64'),
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            })
            .then((response) => {
                console.log(response);

                const expired_key_in_unix = new Date();
                expired_key_in_unix.setSeconds(expired_key_in_unix.getSeconds() + response.data["expires_in"]);

                let output_data = {
                    "success": {
                        "access_token": response.data["access_token"],
                        "token_type": response.data["token_type"],
                        "auth_type": "authorization_code",
                        "expires": expired_key_in_unix.getTime(),
                        "refresh_token": response.data["refresh_token"]
                    }
                };
                res.json(output_data);
            })
            .catch((error) => {
                console.log(error);
                res.json(error);
            });

    }
    else {
        var urlencoded = new URLSearchParams();
        urlencoded.append("grant_type", "refresh_token");
        urlencoded.append("refresh_token", req.body.refresh_token);
        //Refresh Token
        axios.post('/api/token', urlencoded,
            {
                headers: {
                    "Authorization": 'Basic ' + Buffer.from(process.env.CLIENT_ID + ':' + process.env.CLIENT_SECRET).toString('base64'),
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            })
            .then((response) => {
                console.log(response);

                const expired_key_in_unix = new Date();
                expired_key_in_unix.setSeconds(expired_key_in_unix.getSeconds() + response.data["expires_in"]);

                let output_data = {
                    "success": {
                        "access_token": response.data["access_token"],
                        "token_type": response.data["token_type"],
                        "auth_type": "authorization_code",
                        "expires": expired_key_in_unix.getTime(),
                        "refresh_token": null
                    }
                };
                res.json(output_data);
            }) 
            .catch((error) => {
                console.log(error);
                res.json(error);
            });
    }

});
//==================================================
//Utility
function serialize(obj) {
    var str = [];
    for (var p in obj)
        if (obj.hasOwnProperty(p)) {
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        }
    return str.join("&");
}
//==================================================

module.exports.handler = serverless(app);