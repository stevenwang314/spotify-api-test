//Load up the secret environment file located in our local secret.env to load up our keys. This will not be used when its uploaded on the netlify.
require('dotenv').config({ path: "secret.env" });

//Load up our libraries and assign them to functions
const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const axios = require("axios");
let bodyParser = require('body-parser');

//Setup our router
const app = express();
const router = express.Router();

//Configure settings to our express to be able to use CORS settings and body parsing for POST request.
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/.netlify/functions/api', router);
//Axios uses your current url by default. However since we need to talk to another url for API request, we need to change it
axios.defaults.baseURL = 'https://accounts.spotify.com';

router.get('/', (req,res) => {
    res.json({
        'hello': 'you have reached the easter egg of all things! You get.... some bragging rights that you got to over here!'
    })
})
//create our own authorizte API call to redirect to spotify authorization.
router.get('/authorize', (req, res) => {

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
//create our own connect API call to get access token.
router.post('/connect', async (req, res)=> {
  
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