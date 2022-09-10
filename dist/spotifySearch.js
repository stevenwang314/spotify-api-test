const TRACKS = "tracks";
const ALBUMS = "albums";
const ARTISTS = "artists";
class SpotifySearch extends React.Component {
    async getSearch() {
        let searching = document.getElementById("search").value;
        let type = "artist,album,track";
        let search_limit = 50;
        let getData = await fetch('https://api.spotify.com/v1/search?q=' + searching + "&type=" + type + "&include_external=audio&limit=" + search_limit + "&market=US", {
            method: 'GET',
            headers: {
                "Authorization": localStorage.getItem("spotify_token_type") + " " + localStorage.getItem("spotify_access_token"),
                "Content-Type": "application/json"
            }
        })
            .then((response) => {
                response.json().then(
                    (json) => {
                        this.displaySearchResults(json);
                    }
                );
            });
    }

    constructor(props) {
        super(props);

        this.state = {
            searchText: "",
            results: ``,
            albums: ``,
            artists: ``,
            tracks: ``,
            invalidElement: null,
            currentMode: TRACKS
        }

        this.getSearch = this.getSearch.bind(this);
        this.writeJsonFile = this.writeJsonFile.bind(this);
        this.previousSearch = this.previousSearch.bind(this);
        this.nextSearch = this.nextSearch.bind(this);
        this.onSearchModeSwitched = this.onSearchModeSwitched.bind(this);
        this.setPage = this.setPage.bind(this);
        //Loads a json file and then returns a callback once it is sucessful.
        //$.getJSON("example_searchResult.json", (json) => this.writeJsonFile(json));
    }
    onSearchModeSwitched(mode) {

        this.setState(
            {
                currentMode: mode.target.value
            }
        );
    }
    writeJsonFile(json) {
        this.setState(
            {
                results: json,
                albums: json.albums,
                artists: json.artists,
                tracks: json.tracks
            });
    }

    setPage(json) {
        if (json.hasOwnProperty("error") === false) {
            if (this.state.currentMode == TRACKS) {
                this.setState({
                    tracks: json.tracks
                });
            }
            else if (this.state.currentMode == ARTISTS) {
                this.setState({
                    artists: json.artists
                });
            }
            else if (this.state.currentMode == ALBUMS) {
                this.setState({
                    albums: json.albums
                });
            }
        } else {
            processError(json.error);
        }
    }
    displaySearchResults(getJson) {
        if (getJson.hasOwnProperty("error") === false) {
            this.setState(
                {
                    results: getJson,
                    albums: getJson.albums,
                    artists: getJson.artists,
                    tracks: getJson.tracks,
                    invalidElement: null
                }
            )
        }
        else {
            this.setState(
                {
                    invalidElement: (<p className="no-lineBreak">Unknown Error.</p>)
                }
            );
            processError(getJson.error);
        }
    }
    async previousSearch() {
        let choice = (this.state.currentMode == TRACKS ? this.state.tracks : (this.state.currentMode == ARTISTS ? this.state.artists : this.state.albums));
        if (choice.previous != null) {
            let getData = await fetch(choice.previous, {
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
                                this.setPage(json);
                            } else {
                                processError(json.error);
                            }
                        }
                    );
                });
        }
    }
    async nextSearch() {
        let choice = (this.state.currentMode == TRACKS ? this.state.tracks : (this.state.currentMode == ARTISTS ? this.state.artists : this.state.albums));
        if (choice.next != null) {
            let getData = await fetch(choice.next, {
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
                                this.setPage(json);
                            } else {
                                processError(json.error);
                            }
                        }
                    );
                });
        }
    }
    render() {
        let element = null;
        let result = 0;
        let offset = 0;
        let categories = [];
        if (this.state.currentMode == ALBUMS) {
            if (this.state.albums.hasOwnProperty("items") == true) {
                let getResults = this.state.albums["items"];
                result = this.state.albums["total"];
                offset = this.state.albums["offset"];
                element =
                    <tbody>
                        {
                            getResults.map((c, index) =>
                                <tr key={"row" + index}>
                                    <th key={"name" + c} scope="row"><a key={c.external_urls.spotify} className={"no-show-link " + (c.explicit ? "text-danger" : "text-primary") + " search-song-name"} target="_blank" href={c.external_urls.spotify}>{c.name}</a></th>
                                    <td>{c.artists.map(art => (<a key={art.name} href={art.external_urls.spotify} className="no-show-link" target="_blank">{art.name + " "}</a>))}</td>
                                    <td>{c.release_date}</td>
                                    <td>{c.total_tracks}</td>
                                    <td>{<img src={c.images.length > 0 ? c.images[0].url : ""} alt="No Image" width="200" height="200"></img>}</td>
                                    <td>{c.id}</td>
                                </tr>
                            )}
                    </tbody>;
                categories = ["Name", "Artists", "Date Released", "Total Tracks", "Image", "ID"].map(c => <th key={c} scope="col">{c}</th>);
            }
        }
        else if (this.state.currentMode == ARTISTS) {

            if (this.state.artists.hasOwnProperty("items") == true) {
                let getResults = this.state.artists["items"];
                result = this.state.artists["total"];
                offset = this.state.artists["offset"];

                element =
                    <tbody>
                        {
                            getResults.map((c, index) =>
                                <tr key={"artists" + index}>
                                    <th key={"name" + c} scope="row"><a key={c.external_urls.spotify} className={"no-show-link " + (c.explicit ? "text-danger" : "text-primary") + " search-song-name"} target="_blank" href={c.external_urls.spotify}>{c.name}</a></th>

                                    <td>{c.popularity + "/100"}</td>
                                    <td>{c.followers.total.toLocaleString("en-US")}</td>
                                    <td>{c.genres.map(genre => genre).join(", ")}</td>
                                    <td>{<img src={c.images.length > 0 ? c.images[0].url : ""} alt="No Image" width="200" height="200"></img>}</td>
                                    <td>{c.id}</td>
                                    <td><button onClick={() => this.props.addQueuedSong(c)}>{this.props.songData.includes(c) == true ? "remove" : "add"}</button></td>
                                </tr>
                            )}
                    </tbody>;
                categories = ["Name", "Popularity", "Followers", "Genres", "Image", "ID","Options"].map(c => <th key={c} scope="col">{c}</th>);
            }
        } else if (this.state.currentMode == TRACKS) {
            if (this.state.tracks.hasOwnProperty("items") == true) {
                let getResults = this.state.tracks["items"];
                result = this.state.tracks["total"];
                offset = this.state.tracks["offset"];
                element =
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
                                    <button onClick={() => this.props.addIgnoredSong(c)}>{this.props.ignoredData.includes(c) == true ? "(-) ig" : "(+) ig"}</button></td> 
                               </tr>
                            )}
                    </tbody>;
                categories = ["Song Name", "Artist", "Album", "Duration", "Id", "Popularity", "Preview", "Options"].map(c => <th key={c} scope="col">{c}</th>);
            }
        }
        return (
            <div id="search-div">
                <input id="search" placeholder="Search for something (default is Black)"></input>
                <button className="btn-primary" onClick={this.getSearch}>Search</button>
                {this.state.invalidElement && this.state.invalidElement}
                <input type="radio" name="searchType" value={TRACKS} onChange={this.onSearchModeSwitched} checked={this.state.currentMode == TRACKS} />Songs
                <input type="radio" name="searchType" value={ARTISTS} onChange={this.onSearchModeSwitched} checked={this.state.currentMode == ARTISTS} />Artists
                <input type="radio" name="searchType" value={ALBUMS} onChange={this.onSearchModeSwitched} checked={this.state.currentMode == ALBUMS} />Albums
                <div id="search-results">
                   
                    <h1 className="general-font-big">Search results</h1>

                    <table id="search-table" className="table">
                        <thead>
                            <tr key="searchTable">
                                {categories}
                            </tr>

                        </thead>
                        {element && element}
                    </table>

                </div>
                <button onClick={this.previousSearch}>←</button>
                Results found: {result} - Page {result > 0 ? Math.floor(offset / 50) + 1 : 0} / {Math.ceil(result / 50)}
                <button onClick={this.nextSearch}>→</button>
            </div>
        );
    }
}