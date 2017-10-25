import {find, findIndex, remove} from 'lodash';
import {Link, Route} from 'react-router-dom';
import PouchDB from 'pouchdb';

import {db, sync} from '../common/database';
import SongContainer from '../songs/SongContainer';
import transposeChord from '../common/transpose-chord';

import SetViewer from './SetViewer';

class SetContainer extends PreactComponent {
	state = {
		set:   null,
		songs: []
	};

	componentDidMount() {
		this.handleProps( this.props );
	}

	componentWillReceiveProps( nextProps ) {
		this.handleProps( nextProps );
	}

	handleChangeKey = ( songId, amount ) => {

		const set = Object.assign( {}, this.state.set );
		const songs = this.state.songs.slice();
		const song = find( songs, s => s._id === songId );

		song.key = transposeChord( song.key, amount );
		set.songs = songs;

		this.setState( { set, songs } );

		if ( set ) {

			this._saveSet( set, songs );

		}

	};

	handleSongMove = ( songId, targetIndex = 0 ) => {

		const set = Object.assign( {}, this.state.set );
		const songs = this.state.songs.slice();
		const index = findIndex( songs, { _id: songId } );
		const song = songs[ index ];
		const newIndex = Math.max( Math.min( targetIndex, songs.length ), 0 );

		songs.splice( index, 1 );
		songs.splice( newIndex, 0, song );

		this.setState( { songs } );

		if ( set ) {

			this._saveSet( set, songs );

		}

	};

	handleProps = props => {

		this._getSet( props.id );

	};

	handleRemoveSet = () => {

		if ( confirm( 'Are you very sure you want to delete this set?' ) ) {

			const set = this.state.set;

			//1 delete from pouchDb
			db.remove( set._id, set._rev )
				.then( () => {

					if ( this.props.history ) {

						const location = {
							pathname: '/sets'
						};

						this.props.history.replace( location );

					}

				} )
				.catch( err => {

					alert( 'Unable to delete set' );
					console.warn( err );

				} );

		}

	};

	handleRemoveSong = songId => {

		const set = Object.assign( {}, this.state.set );
		const songs = this.state.songs.slice();

		remove( songs, { _id: songId } );

		this.setState( { songs } );

		if ( set ) {

			this._saveSet( set, songs );

		}

	};

	render( props, { set, songs } ) {
		return (
			<div>
				<Route exact path="/sets/:id" render={props => (
					<SetViewer
						onChangeKey={this.handleChangeKey}
						onSongMove={this.handleSongMove}
						onRemoveSet={this.handleRemoveSet}
						onRemoveSong={this.handleRemoveSong}
						set={set}
						songs={songs}
						{...props}/>
				)}/>
				<Route exact path="/sets/:setId/songs/:songId" render={( { match } ) => {

					const songId = match.params.songId;

					const index = findIndex( songs, { _id: songId } );
					const prevSong = index >= 0 ? songs[ index - 1 ] : null;
					const nextSong = index >= 0 ? songs[ index + 1 ] : null;

					const currentKey = set && set.songs[ index ] ?
						set.songs[ index ].key : null;

					return (
						<div>
							{set && (
								<div class="level">
									<div class="level-left">
										<p class="level-item">{set.title}</p>

										{prevSong && (
											<Link
												class="level-item"
												to={`/sets/${set._id}/songs/${prevSong._id}`}
											>
												<span class="icon"><i class="fa fa-angle-left"></i></span>
												{prevSong.title}
											</Link>
										)}

										{nextSong && (
											<Link
												class="level-item"
												to={`/sets/${set._id}/songs/${nextSong._id}`}
											>
												{nextSong.title}
												<span class="icon"><i class="fa fa-angle-right"></i></span>
											</Link>
										)}
									</div>
								</div>
							)}
							<SongContainer
								currentKey={currentKey}
								id={songId}/>
						</div>
					);

				}}/>
			</div>

		);
	}

	_getSet = id => {

		// This gets all sets
		return db.get( id ).then( doc => {

			const set = doc;

			this.setState( { set } );
			this._getSongs( set );

		} ).catch( err => {

			console.warn( 'SetContainer._getSet - fetching set', err );

		} );

	};

	_getSongs = set => {

		const keys = set.songs.map( s => typeof s === 'string' ? s : s._id );

		db.allDocs( {
			include_docs: true,
			keys:         keys
		} ).then( result => {

			this.setState( {
				songs: result.rows.map( r => r.doc ).filter( r => !!r ) || []
			} );

		} ).catch( err => {

			console.warn( 'SetContainer._getSongs - fetching songs', err );

		} );

	};

	_saveSet = ( set, songs ) => {

		db.get( set._id ).then( doc => {

			doc.songs = songs.map( s => ({ _id: s._id, key: s.key }) );

			db.put( doc ).then( () => {

				PouchDB.sync( 'chordboard',
					'https://justinlawrence:cXcmbbLFO8@couchdb.cloudno.de/chordboard' )
					.catch( err => {

						console.warn( 'Could not sync to remote database', err );

					} );

			} ).catch( err => {
				console.error( err );
			} );

		} );

	};
}

export default SetContainer;