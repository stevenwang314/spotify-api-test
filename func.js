const ERROR_ACCESS_TOKEN = "The access token has expired! Press Get Access Token to get another one";
const ERROR_UNKNOWN = "An unspecified error has occured...";
const ERROR_NOMARKS = "Please select at least one song to mark by clicking the Heart button";
const ERROR_TOOMANYMARKS = "There can only be up to 5 marks. Please remove some of the marks";
const ERROR_INVALIDSECRET = "Invalid Secret Key";
const ERROR_INVALIDCLIENT = "Invalid Client Key";
const SUCCESS_ACCESSTOKENGOT = "Successfully obtained an access key (Basic). This only lasts for 1 hour before reobtaining access key";
const SUCCESS_ACCESSTOKENGOT2 = "Successfully obtained an access key (Credentials). This only lasts for 1 hour before reobtaining access key";
const ERROR_AUTHCODEEXPIRED = "Authorization Code has expired, please reverify by clicking Request Permission."
const ERROR_LOGINREQUIRED = "This only works with Credentials access. Click Use Credentials and then Get Access Token to access user account.";
const SUCCESS_ADDTOPLAYLIST = "Successfully saved the list of songs onto a playlist";
const KEY_EXPIRED = "spotify_access_token_expire_time";
const SPOTIFY_REFRESH = "spotify_refresh_token";

const REDIRECT_URI = (process.env.NODE_ENV === "development" ? "http://127.0.0.1:3000/" : "https://spotify-api-test.netlify.app/");
const setTime = (time) => {
    let min = Math.floor(time / 60);
    let sec = Math.floor(time % 60);
    let ms = Math.floor((time - Math.floor(time)) * 1000);
    if (min < 10) {
        min = "0" + min;
    }
    if (sec < 10) {
        sec = "0" + sec;
    }
    return min + ":" + sec + "." + ms;
}

async function requestPermission() {
    window.location = '/functions/authorize';
}
async function getAccessToken() {
    console.log(localStorage.getItem("authCode"));
    
    let getData = await fetch('/.netlify/functions/connect', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            authCode: localStorage.getItem("authCode"),
            refresh_token: localStorage.getItem("spotify_refresh"),

        })
    })
        .then((response) => {
            response.json().then(c=> {
                console.log(c);
                if (c.hasOwnProperty("success")) {
                    localStorage.setItem("spotify_access_token", c.success["access_token"]);
                    localStorage.setItem("spotify_token_type", c.success["token_type"]);
                    localStorage.setItem("spotify_auth_type", c.success["auth_type"]);
                    localStorage.setItem(KEY_EXPIRED, c.success["expires"]);
                    if (c.success["refresh_token"] != null) //If we have a refresh token keep it
                        localStorage.setItem(SPOTIFY_REFRESH, c.success["refresh_token"]);
                    else //Or else delete it
                        localStorage.removeItem(SPOTIFY_REFRESH);

                    getOwnUser();
                }
            });
           
        })

}

//Is called when document is ready.
$(document).ready(function () {
    $("#redirectUri").prop("value", window.location);
    if (localStorage.getItem("authCode") != null && keyExpired()) {
        getAccessToken();
    }

    let getLoc = window.location.search;
    if (getLoc.indexOf("code=") != -1) {
        let txt = getLoc.slice(getLoc.indexOf("code=") + 5, getLoc.length);

        localStorage.setItem("authCode", txt);
        window.location = REDIRECT_URI;
    }


});

function processError(error) {
    if (error.hasOwnProperty("status")) {
        switch (error.status) {
            case 401:
                alert(ERROR_ACCESS_TOKEN);
                break;
            default:
                alert(ERROR_UNKNOWN + " Error Code: " + error.status + "-" + error.message);
                break;
        }
    }
    else if (error.hasOwnProperty("error")) {
        switch (error.error) {
            case "invalid_client": {
                if (error.error_description == 'Invalid client secret')
                    alert(ERROR_INVALIDSECRET);
                else if (error.error_description == 'Invalid client key')
                    alert(ERROR_INVALIDCLIENT);
            }
            case "invalid_grant": {
                if (error.error_description = "Authorization code expired") {
                    alert(ERROR_AUTHCODEEXPIRED);
                }
            }
        }
    } else {
        alert(ERROR_UNKNOWN);
    }
}

const keyExpired = () => {
    return (localStorage.getItem(KEY_EXPIRED) != null && new Date().getTime() > localStorage.getItem(KEY_EXPIRED)) || localStorage.getItem(KEY_EXPIRED) == null;
};
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

setInterval(oneSecondUpdate, 1000);

function oneSecondUpdate() {
    //Update every second.
    if (keyExpired() == true) {
        localStorage.removeItem("spotify_token_type");
        localStorage.removeItem("spotify_access_token");
      
        localStorage.removeItem(KEY_EXPIRED );
        //Automatically get acces token if we have a refresh token.
        if (localStorage.getItem(SPOTIFY_REFRESH) != null && localStorage.getItem("spotify_access_token") == null) {
           getAccessToken();
        }
        //Otherwise we remove the authentication code.
        if (localStorage.getItem("spotify_auth_type") != null && localStorage.getItem(SPOTIFY_REFRESH) == null && localStorage.getItem("spotify_access_token") == null) {
            localStorage.removeItem("authCode");
        }
        localStorage.removeItem("spotify_auth_type");
    }

    let extraText = "";
    if (!keyExpired()) {
        let i = new Date(parseInt(localStorage.getItem(KEY_EXPIRED )));
        extraText = "Session expires at " + (i.getMonth() + 1) + "/" + i.getDate() + "/" + i.getFullYear() + " at " + i.getHours() + ":" + i.getMinutes() + ":" + i.getSeconds();
    } else if (localStorage.getItem("authCode") == null) {
        extraText = "Click to authorize (Requires Spotify account).";
    } else {
        extraText = "Attempting to reauthenticate...";
    }
    $("#instructions").text(extraText);
};

function getOwnUser() {
    //Get the user profile.
    return fetch("https://api.spotify.com/v1/me", {
        method: 'GET',
        headers: {
            "Authorization": localStorage.getItem("spotify_token_type") + " " + localStorage.getItem("spotify_access_token"),
            "Content-Type": "application/json"
        },
    })
        
}