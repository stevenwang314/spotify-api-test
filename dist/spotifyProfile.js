class SpotifyProfile extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            user: [],
            playListData: {
                "href": "https://api.spotify.com/v1/users/steve420-/playlists?offset=0&limit=50",
                "items": []

            }
        };
        this.getUserProfile = this.getUserProfile.bind(this);
        this.extractProfileData = this.extractProfileData.bind(this);
        this.updateTitleAndDesc = this.updateTitleAndDesc.bind(this);

    }
  
    updateTitleAndDesc(playlist, index) {
        let _title = prompt("Set a new playlist name (Leave empty to remain unchanged)");

        let _desc = prompt("Set a new playlist description (Leave empty to remain unchanged)");
        if (_title == "") {
            _title = playlist.name;

        }
        if (_desc == "") {
            _desc = playlist.description;
        }
        fetch("https://api.spotify.com/v1/playlists/" + playlist.id, {
            method: 'PUT',
            headers: {
                "Authorization": localStorage.getItem("spotify_token_type") + " " + localStorage.getItem("spotify_access_token"),
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "name": _title,
                "description": _desc
            })
        })
            .then((response) => {
                if (response.status == 200) { //ok.
       
                    const newPlaylist  = {...this.state.playListData};
                    newPlaylist.items[index].name = _title;
                    newPlaylist.items[index].description = _desc;
                    this.setState({
                        playListData : newPlaylist
                    })
                } 
                else {
                    response.json().then(
                        (json) => {
  
                            if (json.hasOwnProperty("error") === false) {

                                processError(json.error);
                            }
                        }
                    );
                }

            });
    }
    render() {
        let getProfile = (<div></div>);
        let drawAnalyzeList = (<div></div>);
        let categories = (<div></div>);
        if (localStorage.getItem("userID") != null) {
            getProfile = (
                <div>
                    <p className="general-font-big">
                        <a className="no-show-link" target="_blank" href={localStorage.getItem("uri")}>{"User: " + localStorage.getItem("user_name")}</a>
                    </p>
                    <span className="general-font">{"Followers: " + localStorage.getItem("followers")}</span>
                    <span className="general-font space-left">{"ID: " + localStorage.getItem("userID")}</span>
                </div>
            );
        }
        if (this.state.playListData.hasOwnProperty("items")) {
            drawAnalyzeList =
                <tbody>
                    {
                        //Note that for onClick events that have parameters , we must write it in () => function(p1)
                        this.state.playListData.items.map((c, index) => c && <tr key={"track" + index}>
                            <th key={"name" + c} scope="row"><a key={c.external_urls.spotify} className={"no-show-link text-primary search-song-name"} target="_blank" href={c.external_urls.spotify}>{c.name}</a></th>
                            <td>{c.description}</td>
                            <td><img src={c.images.length > 0 ? c.images[0].url : ""} width="200" height="200" alt="playlist image"></img></td>
                            <td>{c.id}</td>
                            <td>{c.owner.display_name}</td>
                            <td>{c.public === true ? "Public" : "Private"}</td>
                            <td>{c.tracks.total}</td>
                            <td>
                                <button onClick={() => this.props.loadPlaylist(this.state.playListData.items[index])}>Load to Playlist</button>
                                <button onClick={() => this.updateTitleAndDesc(c, index)}>Update Info</button>
                            </td>
                        </tr>
                        )}
                </tbody>
            categories = ["Playlist Name", "Playlist Description", "Images", "Id", "Owner", "Public", "Track Count", "Options"].map(c => <th key={c} scope="col">{c}</th>);
        }
        return (
            <div id="profile-bg">

                <h1 className="general-font no-lineBreak">Profile Information</h1>
                <button onClick={this.getUserProfile} className="general-btn-text" id="button-get-profile">Get User Profile</button>
                {getProfile}
                <table id="search-table" className="table">
                    <thead>
                        <tr key="searchTable">{categories}</tr>

                    </thead>
                    {drawAnalyzeList}
                </table>
            </div>
        );
    }

    getUserProfile() {
        //Get the user profile.
        getOwnUser().
            then((response) => {
                response.json().then(
                    (json) => {
                        if (json.hasOwnProperty("error") === false) {
                            this.extractUserData(json);
                        } else {
                            processError(json.error);
                        }
                    }
                );
            });
        //Get a list of playlist.
        let limit = 50;
        fetch("https://api.spotify.com/v1/me/playlists?limit=" + limit, {
            method: 'GET',
            headers: {
                "Authorization": localStorage.getItem("spotify_token_type") + " " + localStorage.getItem("spotify_access_token"),
                "Content-Type": "application/json"
            },
        })
            .then((response) => {
                response.json().then(
                    (json) => {
                        if (json.hasOwnProperty("error") === false) {
                            this.extractProfileData(json);
                        } else {
                            processError(json.error);
                        }

                    }
                );


            });
    }
    extractUserData(json) {
        this.setState({
            user: json
        }, () => {
            localStorage.setItem("userID", json.id);
            localStorage.setItem("followers", json.followers.total);
            localStorage.setItem("user_name", json.display_name);
            localStorage.setItem("uri", json.external_urls.spotify);
        });
    }
    extractProfileData(json) {
        this.setState({
            playListData: json

        });
    }
}