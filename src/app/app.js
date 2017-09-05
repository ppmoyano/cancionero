import Router from 'preact-router';
import {findIndex} from 'lodash';
import Navbar from './common/Navbar/Navbar.js';
import SongList from './common/SongList.js';
import SongEditor from './common/SongEditor.js';
import Sheet from './sheet/Sheet.js';
import PouchDB from 'pouchdb';
import PouchDBFindPlugin from 'pouchdb-find';

PouchDB.plugin( PouchDBFindPlugin );

const db = new PouchDB( 'chordboard' );

// Does nothing if the index already exists
db.createIndex( {
	index: { fields: [ 'type', 'users' ] }
} );

const syncEvents = [
	'active',
	'change',
	'complete',
	'denied',
	'error',
	'paused'
];

const remoteDbSettings = {
	adapter: 'http',
	auth:    {
		username: 'justinlawrence',
		password: 'cXcmbbLFO8'
	}
};
const localDB = new PouchDB( 'chordboard' );
const remoteDB = new PouchDB( 'https://couchdb.cloudno.de/chordboard',
	remoteDbSettings );

const sync = localDB.sync( remoteDB, {
	live:  true,
	retry: true
} );

class App extends PreactComponent {
	state = {
		slug:     "",
		songList: []
	};

	constructor( props ) {
		super( props );

		// This gets docs linked to the user: justin
		db.find( {
			selector: {
				type:  'song',
				users: {
					$in: [ 'justin' ]
				}
			}
		} ).then( result => {

			this.setState( {
				songList: result.docs
			} );

		} ).catch( err => {

			console.warn( 'App.constructor - pouchdb query failed', err );

		} );

		this.setSongFromUrl( Router.getCurrentUrl() );

		Router.subscribers.push( url => {

			this.setState( {
				slug: ""
			} );

			this.setSongFromUrl( url );

		} );

		syncEvents.forEach( syncEvent => {
			sync.on( syncEvent, arg => {
				//store.dispatch( { type: types.SET_SYNC_STATE, text: syncEvent } )
				console.log( "syncEvent", syncEvent, arg );

			} );
		} );

	}

	goToNextSong = () => {

		const index = findIndex( this.state.songList,
			s => s.slug === this.state.slug );

		this.goToSongIndex( index + 1 );

	};

	goToPreviousSong = () => {

		const index = findIndex( this.state.songList,
			s => s.slug === this.state.slug );

		this.goToSongIndex( index - 1 );

	};

	goToSongIndex = index => {

		const len = this.state.songList.length;

		// Set index range to between 0 and list length.
		index = Math.min( Math.max( index, 0 ), len - 1 );

		// OR

		// Set index to wrap around at the ends.
		//index = index < 0 ? len - 1 : index >= len ? 0 : index;

		const song = this.state.songList[ index ];

		Router.route( `/songs/${song.slug}` );

	};

	setSongFromUrl = url => {

		const slugMatch = url.match( /\/songs\/(.+)$/ );

		if ( slugMatch ) {

			this.setState( {
				slug: slugMatch[ 1 ]
			} );

		}

	};

	render( {}, { slug, songList } ) {

		return (
			<div>
				<Navbar goToNextSong={this.goToNextSong}
				        goToPreviousSong={this.goToPreviousSong}/>
				<Router>
					<SongList default path="/songs" songs={songList}/>
					<SongEditor path="/new"/>
					<SongEditor path="/songs/:slug/edit" slug={slug}/>
					<Sheet path="/songs/:slug" slug={slug}/>
				</Router>
			</div>
		);

	}
}

export default App;
