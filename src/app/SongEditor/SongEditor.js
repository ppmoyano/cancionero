import {isNil} from 'lodash';
import slugify from 'slugify';
import PouchDB from 'pouchdb';
import PouchDBFindPlugin from 'pouchdb-find';
import {parseSong} from '../SongViewer/SongViewer.js';
import Song from '../common/Song.js';
import '../SongEditor/SongEditor.scss';

PouchDB.plugin( PouchDBFindPlugin );

const db = new PouchDB( 'chordboard' );

db.createIndex( {
	index: { fields: [ 'type', 'slug' ] }
} );

class SongEditor extends PreactComponent {
	state = {
		author:    '',
		isLoading: false,
		title:     '',
		key:     	 '',
		content:   '',
		song:      null
	};

	componentDidMount() {
		this.handleProps( this.props );
	}

	componentWillReceiveProps( nextProps ) {
		this.handleProps( nextProps );
	}

	handleProps = props => {

		this.setState( {
			isLoading: true
		} );

		if ( props.slug ) {

			db.find( {
				selector: {
					type: 'song',
					slug: props.slug
				}
			} ).then( result => {

				const song = new Song( result.docs[ 0 ] );

				this.setState( {
					author:    song.author,
					isLoading: false,
					title:     song.title,
					key:	     song.key,
					content:   song.content,
					song:      song
				} );

			} ).catch( err => {

				console.error( 'SongViewer.handleProps -', err );

				this.setState( {
					author:    '',
					isLoading: false,
					title:     '',
					key:			 '',
					content:   '',
					song:      null
				} );

			} );

		}

	};

	onAuthorInput = event => {
		this.setState( { author: event.target.value } );
	};

	onContentInput = event => {
		const content = event.target.value;
		const song = Object.assign( {}, this.state.song, { content } );
		this.setState( { content, song } );
	};

	onTitleInput = event => {
		this.setState( { title: event.target.value } );
	};

	onKeyInput = event => {
		this.setState( { key: event.target.value } );
	};

	onDeleteSong = () => {
		alert("Sorry, you can't delete songs yet.");
		/*
		if (alert("Are you very sure you want to delete this song?")) {
			//TODO: delete from pouchDb and refresh to song list with a message saying song deleted
		};
		*/
	};


	onSaveSong = () => {

		const { author, content, title, key, song } = this.state;
		const isNew = isNil( song._id );

		if ( isNew ) {

			// First check to see if the slug already exists.
			db.find( {
				selector: {
					type: 'song',
					slug: slugify( title )
				}
			} ).then( result => {

				if ( result.docs.length ) {

					// Slug already exists
					alert( 'Slug already exists' );

					// TODO: make the slug unique by appending a number to the
					// end Note: If we wanted to allow duplicate slugs across
					// database but unique per user, we would require some kind
					// of user context in the url. Something like what GitHub
					// do with the username first.

				} else {

					db.post( {
						type:    'song',
						users:   [ 'justin' ], //TODO
						slug:    slugify( title ),
						author:  author,
						title:   title,
						key: 	   key,
						content: content
					} ).then( () => {

						alert( 'Added new song!' );

						//TODO
						PouchDB.sync( 'chordboard', 'https://justinlawrence:cXcmbbLFO8@couchdb.cloudno.de/chordboard' );

					} );

				}

			} ).catch( err => {
				console.error( err );
			} );

		} else {

			const data = Object.assign( {}, song );

			data.author = author;
			data.content = content;
			data.slug = slugify( title );
			data.title = title;
			data.key = key;

			db.put( data ).then( ( data ) => {

				alert( 'Updated successfully!' );

				this.setState( {
					song: Object.assign( {}, this.state.song,
						{ _rev: data.rev } )
				} );

				PouchDB.sync( 'chordboard', 'https://justinlawrence:cXcmbbLFO8@couchdb.cloudno.de/chordboard' )
					.catch( err => {

						console.warn( 'Could not sync to remote database',
							err );

					} );

			} ).catch( err => {
				console.error( err );
			} );

		}

	};

	render( {}, { author, title, key, content, song} ) {

		return (
			<section class="section">
				<div class="container">
					<div class="columns">
						<div class="column is-three-quarters">

							<div class="field">

								<p class="control has-icons-left">
									<input
										type="text"
										class="input"
										onInput={this.onTitleInput}
										placeholder="Title"
										value={title}/>

									<span class="icon is-small is-left">
						                <i class="fa fa-chevron-right"></i>
						            </span>

								</p>
							</div>

							<div class="field">

								<p class="control has-icons-left">
									<input
										type="text"
										class="input"
										onInput={this.onAuthorInput}
										placeholder="Author"
										value={author}/>

									<span class="icon is-small is-left">
					      		<i class="fa fa-chevron-right"></i>
					    		</span>
								</p>

							</div>

							<div class="field">

								<p class="control has-icons-left">
									<input
										type="text"
										class="input"
										onInput={this.onKeyInput}
										placeholder="Key"
										value={key}/>

									<span class="icon is-small is-left">
					      		<i class="fa fa-chevron-right"></i>
					    		</span>
								</p>

						</div>

						<div class="field">

							<p class="control">
								<textarea
									class="textarea song-editor__content"
									onInput={this.onContentInput}
									placeholder="Type words and chords here."
									rows="25"
								>
									{content}
								</textarea>
							</p>

						</div>

						</div>

						<div class="column">

							<div class="level-left">
								<div class="level-item">

										<a class="button is-outlined" onClick={this.onDeleteSong}>
											 <span class="icon is-small is-left">
												 <i class="fa fa-trash"></i>
											</span>
										</a>
								</div>
								<div class="level-item">

										<a class="button is-primary"
										   onClick={this.onSaveSong}>Save</a>

								</div>
							</div>

							<div class="song-editor__preview">

								<h1 class="title">
									{title}
								</h1>
								<h2 class="subtitle">
									{author}
								</h2>

								<div class="song-editor__preview-content">
									{parseSong( new Song( song ), [] )}
								</div>

							</div>
						</div>
					</div>
				</div>
			</section>
		);

	}
}

export default SongEditor;