function serialize(obj) {
    var str = [];
    for (var p in obj)
        if (obj.hasOwnProperty(p)) {
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        }
    return str.join("&");
}

exports.handler = async function (event, context, callback) {

    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Hello World" }),
        headers: 
        {
            Location: 'https://accounts.spotify.com/authorize?' + serialize(
            {
                client_id: process.env.CLIENT_KEY,
                response_type: 'code',
                redirect_uri: "https://spotify-api-test.netlify.app",
                scope: `ugc-image-upload user-modify-playback-state 
                user-read-playback-state user-read-currently-playing 
                user-follow-modify user-follow-read user-read-recently-played user-top-read
                playlist-read-collaborative playlist-modify-public playlist-read-private playlist-modify-private
                app-remote-control streaming user-read-email user-read-private user-library-modify user-library-read`
    
            }
        }
    };
}