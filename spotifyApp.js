

class SpotifyApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            queuedSongs: [],
            ignoredSongs: [],
        };
        this.addQueuedSong = this.addQueuedSong.bind(this);
        this.markSong = this.markSong.bind(this);
        this.removeQueuedSong = this.removeQueuedSong.bind(this);
        this.modifyQueuedSong = this.modifyQueuedSong.bind(this);
        this.loadQueuedSong = this.loadQueuedSong.bind(this);
        this.cleanQueuedSong = this.cleanQueuedSong.bind(this);
        this.modifyIgnoredSong = this.modifyIgnoredSong.bind(this);
        this.addIgnoredSong = this.addIgnoredSong.bind(this);
        this.removeIgnoredSong = this.removeIgnoredSong.bind(this);
        this.saveQueue = this.saveQueue.bind(this);
        this.loadQueue = this.loadQueue.bind(this);
        this.extractArtist = this.extractArtist.bind(this);
    }
    extractArtist() {

        let artist = this.state.queuedSongs.map(c => c.artists.flat());

        let adata = [];
        artist.forEach(c => {

            for (let data in c) {

                adata.push(c[data]);
            }
        });
        //Eliminate duplicates.

        let artistId = adata.map(c => c.id);
        for (let item in adata) {
            if (artistId.indexOf(adata[item].id) == item)
                this.addQueuedSong(adata[item]);
        }
    }
    render() {
        return (
            <div id="spotifyApp">
                {/*Profiles*/ }
                <SpotifyProfile loadPlaylist={this.loadQueuedSong}/>
                <div id="bottom-indent"/>
                <SpotifySearch addIgnoredSong={this.modifyIgnoredSong} addQueuedSong={this.modifyQueuedSong} ignoredData={this.state.ignoredSongs} songData={this.state.queuedSongs} />

                <button id="extractArtist" onClick={this.extractArtist}>Extract Artist from Queue</button>
                <div id="bottom-indent"/>
                <SpotifySongAnalysis addIgnoredSong={this.modifyIgnoredSong} addQueuedSong={this.modifyQueuedSong} songData={this.state.queuedSongs} ignoreData={this.state.ignoredSongs} markSelectedSong={this.markSong} remove={this.removeQueuedSong} remove2={this.removeIgnoredSong} save={this.saveQueue} load={this.loadQueue} clear={this.cleanQueuedSong} />
            </div>
        );
    }

    async loadQueuedSong(json) {
        let max = json.tracks.total;
        let market = "US";
        let limit = 50;
      
        for (let i = 0; i < Math.ceil(max / limit); i++) {
            let offset = 50 * i;
            await fetch(json.tracks.href + "?limit=" + limit + "&market=" + market + "&offset=" + offset, {
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
                                let queue_to_add = json.items.map(c => c.track);
                                for (let i = 0; i < queue_to_add.length; i++) {

                                    this.addQueuedSong(queue_to_add[i]);
                                }
                            } else {
                                processError(json.error);
                            }

                        }
                    );


                });
            await sleep(500);
        }
    }
    cleanQueuedSong() {
        this.setState({
            queuedSongs: [],
            ignoredSongs: []
        });
    }
    addQueuedSong(song) {
        this.setState(prevState => ({
            queuedSongs: [...prevState.queuedSongs, song]
        }), () => {
            this.removeIgnoredSong(song);
        });

    }
    removeIgnoredSong(song) {
        if (this.state.ignoredSongs.indexOf(song) != -1) {
            let a = this.state.ignoredSongs.indexOf(song);
            this.setState({
                ignoredSongs: this.state.ignoredSongs.filter((c, index) => {
                    return index != a;
                })
            }, () => {

            });
        }
    }
    addIgnoredSong(song) {

        if (this.state.ignoredSongs.indexOf(song) == -1) {
            this.setState({
                ignoredSongs: [...this.state.ignoredSongs, song]
            }, () => {

                this.removeQueuedSong(song);
            });
        }
    }
    removeQueuedSong(song) {
        if (this.state.queuedSongs.indexOf(song) != -1) {
            let a = this.state.queuedSongs.indexOf(song);
            this.setState({
                queuedSongs: this.state.queuedSongs.filter((c, index) => {
                    return index != a;
                })
            }, () => {

            });
        }
    }
    modifyQueuedSong(song) {
        if (this.state.queuedSongs.indexOf(song) != -1) {
            this.removeQueuedSong(song);
        } else {
            this.addQueuedSong(song);
        }
    }
    modifyIgnoredSong(song) {
        if (this.state.ignoredSongs.indexOf(song) != -1) {
            this.removeIgnoredSong(song);
        } else {
            this.addIgnoredSong(song);
        }
    }
    markSong(index) {
        if (index != -1) {
            if (!this.state.queuedSongs[index].hasOwnProperty("selected")) //create a selected
                this.setState(prevState => {
                    let getObj = Object.assign({}, prevState.queuedSongs);  // creating copy of state variable jasper
                    getObj[index].selected = true;                     // update the name property, assign a new value                 
                    return { getObj };
                });

            else {
                this.setState(prevState => {
                    let getObj = Object.assign({}, prevState.queuedSongs);  // creating copy of state variable jasper
                    getObj[index].selected = !prevState.queuedSongs[index].selected;                     // update the name property, assign a new value                 
                    return { getObj };
                });
            }
        }
    }

    saveQueue(json) {

        //Create a temporary HTML element that allows us to download a generate file and then delete it afterwards.
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(json)));
        element.setAttribute('download', "songQueuedList.txt");

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }
    loadQueue() {
        let input = document.createElement('input');
        input.type = 'file';
        input.onchange = e => {
            //Grab the contents of the result.
            let file = e.target.files[0];
            //Get a FileReader Object to read our text
            var reader = new FileReader();
            reader.readAsText(file, 'UTF-8');
            //Load our contents 
            reader.onload = readerEvent => {
                var content = readerEvent.target.result; // this is the content!
                //Load our own JSON from file.
                let getJson = JSON.parse(content);
                this.setState({
                    queuedSongs: getJson.favorite,
                    ignoredSongs: getJson.ignore
                });
            }
        };
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    }
}
ReactDOM.render(<SpotifyApp />, document.getElementById("spotifyData"));
