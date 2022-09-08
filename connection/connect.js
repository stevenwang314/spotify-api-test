exports.handler = async function (event, context, callback) {
    //Only get key is the refresh token has expired.
    if (localStorage.getItem("spotify_refresh") === null) {
        //Form needs to be urlencoded since our content-type is set to urlencoded
        var urlencoded = new URLSearchParams();
        urlencoded.append("grant_type", "authorization_code");
        urlencoded.append("code", localStorage.getItem("authCode"));
        urlencoded.append("redirect_uri", window.location);
        //Use Client credentials
        let getData = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            body: urlencoded,
            headers: {
                "Authorization": 'Basic ' + btoa($process.env.CLIENT_KEY + ':' + process.env.SECRET_KEY),
                "Content-Type": "application/x-www-form-urlencoded"
            }
        })
            .then((response) => {
                response.json().then(function (json) {
                    if (json.hasOwnProperty("access_token")) {
                        localStorage.setItem("spotify_access_token", json["access_token"]);
                        localStorage.setItem("spotify_token_type", json["token_type"]);
                        localStorage.setItem("spotify_auth_type", "authorization_code");
                        const today = new Date();
                        today.setSeconds(today.getSeconds() + json["expires_in"]);
                        localStorage.setItem("spotify_expires_authCode", today.getTime());
                        localStorage.setItem("spotify_refresh", json["refresh_token"]);

                        getOwnUser().
                            then((response) => {
                                response.json().then(
                                    (json) => {
                                        if (json.hasOwnProperty("error") === false) {
                                            localStorage.setItem("userID", json.id);
                                            localStorage.setItem("user_name", json.display_name);
                                            localStorage.setItem("followers", json.followers.total);
                                            localStorage.setItem("uri", json.external_urls.spotify);
                                        } else {
                                            processError(json.error);
                                        }
                                    }
                                );
                            });
                        alert(SUCCESS_ACCESSTOKENGOT2);
                    } else {
                        console.log(json);
                        processError(json);
                    }
                });
            });
    }
}