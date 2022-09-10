
class SpotifySongAnalysis extends React.Component {
    constructor(props) {
        super(props);
        this.songAnalyzedResults = {};
        this.trackCount = 0;
        this.state = {
            analyzedData: {
                "audio_features": []
            },
            songRecommend: {

            },
            listDisplayMode: 0,
            songsFound: 0
        }
        this.analyzeSongs = this.analyzeSongs.bind(this);
        this.parseSongAnalysisList = this.parseSongAnalysisList.bind(this);
        this.getSongRecommendations = this.getSongRecommendations.bind(this);
        this.recommendSongs = this.recommendSongs.bind(this);
        this.parseRecommendationList = this.parseRecommendationList.bind(this);
        this.saveToPlaylist = this.saveToPlaylist.bind(this);
        this.addItemsToPlaylist = this.addItemsToPlaylist.bind(this);
        this.resetRecommendations = this.resetRecommendations.bind(this);
        this.addRecommendedSongstoList = this.addRecommendedSongstoList.bind(this);
        this.songsAddedAsRecommendations = [];
        this.changeDisplay = this.changeDisplay.bind(this);
        //Loads a json file and then returns a callback once it is sucessful.
        //$.getJSON("example_songAnalysis.json", (json) => this.parseSongAnalysisList(json));
        //$.getJSON("example_songRecommendation.json", (json) => this.parseRecommendationList(json));
    }
    parseSongAnalysisList(json) {

        this.setState(
            {
                analyzedData: json
            },
            () => {

                //Computers the average of each attribute of each song.
                this.songAnalyzedResults = {};
                let newFilter = this.state.analyzedData.audio_features.filter(c => c != null);

                let keys = Object.keys(newFilter[0]).filter(c => { return c != null && c != "type" && c != "id" && c != "uri" && c != "track_href" && c != "analysis_url" });


                for (let data in keys) {
                    this.songAnalyzedResults[keys[data]] =
                        newFilter.reduce((previous, current) => {
                            return previous + current[keys[data]];
                        }, 0) / newFilter.length;

                }

                for (let data in keys) {
                    this.songAnalyzedResults["min_" + keys[data]] =
                        newFilter.reduce((previous, current) => {
                            return Math.min(previous, current[keys[data]]);
                        }, Number.MAX_VALUE);

                }

                for (let data in keys) {
                    this.songAnalyzedResults["max_" + keys[data]] =
                        newFilter.reduce((previous, current) => {
                            return Math.max(previous, current[keys[data]]);
                        }, Number.MIN_VALUE);

                }

                this.getSongRecommendations();
            }
        );
    }
    parseRecommendationList(json) {

        this.setState(
            {
                songRecommend: json
            }, () => {
                this.addRecommendedSongstoList();
            });
    }
    addRecommendedSongstoList() {
        if (this.state.songRecommend.hasOwnProperty("tracks")) {
            let getQueueId = this.props.songData.map(c => c.id);
            let foundList = this.songsAddedAsRecommendations.map(c => c.id);
            let data = this.state.songRecommend.tracks.filter(c => foundList.includes(c.id) === false);

            let conc = this.songsAddedAsRecommendations.concat(data);
            this.songsAddedAsRecommendations = conc.filter((c, index) => {

                return !getQueueId.includes(c.id);
            })

            this.setState({
                songsFound: this.songsAddedAsRecommendations.length
            })
        }
    }

    async getSongRecommendations() {

        //Get up to 5 items for tracks or artists as seeds.
        let seed_tracks = "seed_tracks=" + this.props.songData.filter(c => { return c.type == "track" && c.selected === true; }).map((c, index) => {

            return c.id;

        }).join(",");
        let seed_artists = "seed_artists=" + this.props.songData.filter(c => { return c.type == "artist" && c.selected === true; }).map((c, index) => {

            return c.id;

        }).join(",");

        if (seed_artists == "seed_artists=") {
            seed_artists = "";
        }
        if (seed_tracks == "seed_tracks=") {
            seed_tracks = "";
        }
        let combo = [seed_artists, seed_tracks].filter(c => c != "").join("&");

        //Then use a long list of parameters to get recommendations. Only if we have at least one song on this list or else use a basic data.
        let data = this.trackCount > 0 ? [
            "limit=100",
            "market=US",
            "min_popularity=" + (document.getElementById("slider-playlist").value),
            "max_popularity=100",
            "max_acousticness=" + (this.songAnalyzedResults.max_acousticness),
            "min_acousticness=" + this.songAnalyzedResults.min_acousticness,
            "max_danceability=" + this.songAnalyzedResults.max_danceability,
            "min_danceability=" + this.songAnalyzedResults.min_danceability,
            "max_duration_ms=" + Math.floor(this.songAnalyzedResults.max_duration_ms),
            "min_duration_ms=" + Math.floor(this.songAnalyzedResults.min_duration_ms),
            "max_energy=" + this.songAnalyzedResults.max_energy,
            "min_energy=" + this.songAnalyzedResults.min_energy,
            "max_instrumentalness=" + this.songAnalyzedResults.max_instrumentalness,
            "min_instrumentalness=" + this.songAnalyzedResults.min_instrumentalness,
            "max_key=" + Math.ceil(Math.min(11, this.songAnalyzedResults.max_key)),
            "min_key=" + Math.floor(this.songAnalyzedResults.min_key),
            "max_liveness=" + this.songAnalyzedResults.max_liveness,
            "min_liveness=" + this.songAnalyzedResults.min_liveness,
            "max_loudness=" + (this.songAnalyzedResults.max_loudness),
            "min_loudness=" + (this.songAnalyzedResults.min_loudness),
            "max_mode=" + Math.ceil(this.songAnalyzedResults.max_mode),
            "min_mode=" + Math.floor(this.songAnalyzedResults.min_mode),
            "max_speechiness=" + this.songAnalyzedResults.max_speechiness,
            "min_speechiness=" + this.songAnalyzedResults.min_speechiness,
            "max_tempo=" + (this.songAnalyzedResults.max_tempo),
            "min_tempo=" + (this.songAnalyzedResults.min_tempo),
            "max_time_signature=" + Math.ceil(this.songAnalyzedResults.max_time_signature),
            "min_time_signature=" + Math.floor(this.songAnalyzedResults.min_time_signature),
            "max_valence=" + (this.songAnalyzedResults.max_valence),
            "min_valence=" + (this.songAnalyzedResults.min_valence),
            "target_acousticness=" + (this.songAnalyzedResults.acousticness),
            "target_danceability=" + (this.songAnalyzedResults.danceability),
            "target_duration_ms=" + Math.round(this.songAnalyzedResults.duration_ms),
            "target_energy=" + (this.songAnalyzedResults.energy),
            "target_instrumentalness=" + (this.songAnalyzedResults.instrumentalness),
            "target_key=" + Math.round(this.songAnalyzedResults.key),
            "target_liveness=" + (this.songAnalyzedResults.liveness),
            "target_loudness=" + (this.songAnalyzedResults.loudness),
            "target_mode=" + Math.round(this.songAnalyzedResults.mode),
            "target_speechiness=" + (this.songAnalyzedResults.speechiness),
            "target_tempo=" + (this.songAnalyzedResults.tempo),
            "target_time_signature=" + Math.round(this.songAnalyzedResults.time_signature),
            "target_valence=" + (this.songAnalyzedResults.valence),
        ].join("&") : [
            "limit=100",
            "market=US",
            "min_popularity=" + (document.getElementById("slider-playlist").value),
            "max_popularity=100",
        ].join("&");

        this.recommendSongs(combo, data);

    }
    async recommendSongs(combo, data) {

        let getData = await fetch('https://api.spotify.com/v1/recommendations?' + combo + "&" + data, {
            method: 'GET',
            headers: {
                "Authorization": localStorage.getItem("spotify_token_type") + " " + localStorage.getItem("spotify_access_token"),
                "Content-Type": "application/json"
            }
        })
            .then((response) => {
                response.json().then(
                    (json) => {
                        if (json.hasOwnProperty("error") === false) {
                            this.parseRecommendationList(json);
                        }
                        else {
                            processError(json.error);
                        }
                    }
                );
            });

    }
    async analyzeSongs() {
        if (this.props.songData.filter(c => c.selected == true).length == 0) {
            alert(ERROR_NOMARKS);
            return;
        }
        if (this.props.songData.filter(c => c.selected == true).length > 5) {
            alert(ERROR_TOOMANYMARKS);
            return;
        }
        this.trackCount = this.props.songData.filter(c => { return c.type == "track" }).length;
        if (this.trackCount > 0) {
            let getList = [];
            for (let i = 0; i < Math.ceil(this.trackCount / 100); i++) {

                let data = this.props.songData.slice(i* 100,i * 100 + 100);
                let output = data.map(c => { if (c.type == "track") return c.id; }).join(",");
                let getData = await fetch('https://api.spotify.com/v1/audio-features?ids=' + output, {
                    method: 'GET',
                    headers: {
                        "Authorization": localStorage.getItem("spotify_token_type") + " " + localStorage.getItem("spotify_access_token"),
                        "Content-Type": "application/json"
                    }
                })
                    .then((response) => {
                        response.json().then(
                            (json) => {

                                if (json.hasOwnProperty("error") === false) {
                                 getList.audio_features = [].concat(getList.audio_features, json.audio_features);
                                
      
                                 if (getList.audio_features.length > 0 && i + 1 ==  Math.ceil(this.trackCount / 100)) {
                                    console.log(getList);
                                    this.parseSongAnalysisList(getList);
                                 }
                                } else {
                                    processError(json.error);
                                }
                            }
                        );
                    });
        
                console.log(i);
            }
            await sleep(500);
        } else {
            this.getSongRecommendations();
        }
    }
    async saveToPlaylist() {
        if (localStorage.getItem("spotify_auth_type") === "authorization_code") {
            let user = localStorage.getItem("userID");
            //Only create a new playlist if no playlist input is typed.
            if (document.getElementById("input-playlist").value == "") {
                let playlistName = "Generated Playlist";
                let visibility = false;
                let description = "Made by Steven's Spotify song recommendator program.";
                let getData = await fetch("https://api.spotify.com/v1/users/" + user + "/playlists", {
                    method: 'POST',
                    headers: {
                        "Authorization": localStorage.getItem("spotify_token_type") + " " + localStorage.getItem("spotify_access_token"),
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        "name": playlistName,
                        "public": visibility,
                        "description": description
                    })
                })
                    .then((response) => {
                        response.json().then(
                            (json) => {

                                if (json.hasOwnProperty("error") === false) {
                                    //Get the playlist id
                                    document.getElementById("input-playlist").value = json.id;
                                    this.addItemsToPlaylist(json.id);

                                } else {
                                    processError(json.error);
                                }
                            }
                        );


                    });
            } else {
                //Add the items to existing playlist.
                this.addItemsToPlaylist(document.getElementById("input-playlist").value);
            }
        } else {
            alert("This option only works with credential access tokens.");
        }
    }
    resetRecommendations() {
        this.songsAddedAsRecommendations = [];
        this.setState({
            songsFound: 0
        })
    }
    async addItemsToPlaylist(json) {
        if (localStorage.getItem("spotify_auth_type") === "authorization_code") {
            let ignore = this.props.ignoreData.map(c => c.id);
            let songRecommendData = this.songsAddedAsRecommendations.filter(c => ignore.includes(c.id) === false).map(c => c.uri);
            for (let i = 0; i < Math.ceil(this.state.songsFound / 100); i++) {


                await fetch("https://api.spotify.com/v1/playlists/" + json + "/tracks", {
                    method: 'POST',
                    headers: {
                        "Authorization": localStorage.getItem("spotify_token_type") + " " + localStorage.getItem("spotify_access_token"),
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        "uris": songRecommendData.slice(100 * i, 100 * (i + 1) - 1)
                    })
                })
                    .then((response) => {
                        response.json().then(
                            (json) => {
                                if (json.hasOwnProperty("error") === false) {
                                    console.log(json);
                                    alert(SUCCESS_ADDTOPLAYLIST);
                                } else {
                                    processError(json.error);
                                }

                            }
                        );


                    });
                    await sleep(500);
            }
        } else {
            alert(ERROR_LOGINREQUIRED);
        }
    }
    changeDisplay(index) {
        this.setState({
            listDisplayMode: index
        })
    }
    render() {
        //Draw our favorites and ignore list.
        let drawList = (this.state.listDisplayMode === 0) ?
            (this.props.songData.map((c, index) => {

                return (
                    <li key={"analysis" + index} className={"general-font list-group-item" + (c.selected === true ? " list-group-item-info " : (c.type == "track" ? " list-group-item-warning " : (c.type == "album" ? " list-group-item-info " : " list-group-item-secondary ")))}>
                        <button onClick={() => this.props.remove(c)}>X</button>
                        <button onClick={() => this.props.markSelectedSong(index)}>❤</button>
                        {index + ") " + c.type + " - (" + c.name + ") - id: " + c.id}
                    </li>

                )
            }
            )) :
            (this.props.ignoreData.map((c, index) => {

                return (
                    <li key={"analysis" + index} className={"general-font list-group-item" + (c.selected === true ? " list-group-item-info " : (c.type == "track" ? " list-group-item-warning " : (c.type == "album" ? " list-group-item-info " : " list-group-item-secondary ")))}>
                        <button onClick={() => this.props.remove2(c)}>X</button>
                        {index + ") " + c.type + " - (" + c.name + ") - id: " + c.id}
                    </li>

                )
            }
            ));
        //draw our list of songs generated from spotify recommendations.
        let drawAnalyzeList = "";
        let categories = null;

        if (this.songsAddedAsRecommendations.length > 0) {
            let getResults = this.songsAddedAsRecommendations;

            drawAnalyzeList =
                <tbody>
                    {
                        //Note that for onClick events that have parameters , we must write it in () => function(p1)
                        getResults.map((c, index) =>
                            <tr key={"track" + index}>
                                <th key={"name" + c} scope="row"><a key={c.external_urls.spotify} className={"no-show-link " + (c.explicit ? "text-danger" : "text-primary") + " search-song-name"} target="_blank" href={c.external_urls.spotify}>{c.name}</a></th>
                                <td>{c.artists.map(art => (<a key={art.name} href={art.external_urls.spotify} className="no-show-link" target="_blank">{art.name + " "}</a>))}</td>
                                <td><a key={c.album.name} href={c.album.external_urls.spotify} className="no-show-link" target="_blank">{c.album.name}</a></td>
                                <td>{setTime(c.duration_ms / 1000)}</td>
                                <td>{c.id}</td>
                                <td>{c.popularity + "%"}</td>
                                <td>{c.preview_url && <audio controls src={c.preview_url}>Unsupported by your browser...</audio>}</td>
                                <td><button onClick={() => this.props.addQueuedSong(c)}>{this.props.songData.includes(c) == true ? "(-) fav" : "(+) fav"}</button>
                                    <button onClick={() => this.props.addIgnoredSong(c)}>{this.props.ignoreData.includes(c) == true ? "(-) ig" : "(+) ig"}</button></td>
                            </tr>
                        )}
                </tbody>;
            categories = ["Song Name", "Artist", "Album", "Duration", "Id", "Popularity", "Preview", "Options"].map(c => <th key={c} scope="col">{c}</th>);
        }
        return (
            <div>

                <div id="songAnalysisBackground">

                    <h1 >Song Recommendations</h1>
                    <button id="btn-recommend" onClick={this.analyzeSongs}>Recommend me my Song!</button>
                    <button id="btn-save" onClick={() => this.props.save({ "favorite": this.props.songData, "ignore": this.props.ignoreData })}>Save Queue</button>
                    <button id="btn-load" onClick={this.props.load}>Load Queue</button>
                    <button id="btn-load" onClick={this.props.clear}>Clear Queue</button>
                    <input id="radio-fav" type="radio" name="list1" defaultChecked onClick={() => this.changeDisplay(0)} /><span>Favorites</span>
                    <input id="radio-ignore" className="pushLeft" name="list1" type="radio" onClick={() => this.changeDisplay(1)} /><span>Ignore</span>
                    <div id="song-analysis">

                        <ul className="list-group ">
                            {drawList}
                        </ul>
                    </div>

                    <div id="song-analysis-results">
                        <ul className="list-group ">

                            <table id="search-table" className="table">
                                <thead>
                                    <tr key="searchTable">{categories}</tr>

                                </thead>
                                {drawAnalyzeList}
                            </table>

                        </ul>

                    </div>

                </div>
                <div id="songAnalysisBackgroundOption">
                    <button id="btn-save-playlist" onClick={this.saveToPlaylist}>Save recommendations to playlist!</button>
                    <input className="pushLeft" id="input-playlist" type="input" placeholder="playlist id" ></input>
                    <span className="pushLeft" id="span-playlist">Minimum Popularity: </span>
                    <input className="pushLeft" id="slider-playlist" type="number" min="0" max="100" defaultValue="50" />
                    <button className="pushLeft" id="btn-add-recommend-playlist" onClick={this.addRecommendedSongstoList}> {"Add recent to song list (" + (this.state.songRecommend.hasOwnProperty("tracks") ? this.state.songRecommend.tracks.length : 0) + ")"}</button>
                    <button className="pushLeft" id="btn-clear-playlist" onClick={this.resetRecommendations}> {"Clear all songs: (" + this.songsAddedAsRecommendations.length + ")"}</button>
                </div>
            </div>
        );
    }
}
