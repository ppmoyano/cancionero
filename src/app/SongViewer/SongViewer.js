import React, { Component } from 'react';
import * as actions from '../../actions';
import { connect } from 'react-redux';
import cx from 'classnames';
import ChordLine from "./lines/ChordLine.js";
import ChordPair from "./lines/ChordPair.js";
import ContentLimiter from '../../components/ContentLimiter';
import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import getKeyDiff from 'app/common/getKeyDiff';
import Grid from '@material-ui/core/Grid';
import Hero from '../../components/Hero';
import IconButton from '@material-ui/core/IconButton';
import { includes, uniqBy } from 'lodash';
import InputAdornment from '@material-ui/core/InputAdornment';
import InputLabel from '@material-ui/core/InputLabel';
import KeySelector from 'app/common/KeySelector';
import Line from "./lines/Line.js";
import { Link } from 'react-router-dom';
import MenuItem from '@material-ui/core/MenuItem';
import Parser from 'app/parsers/song-parser.js';
import PropTypes from 'prop-types';
import Select from '@material-ui/core/Select';
import { Sets, db, sync } from 'database';
import transposeChord from '../common/transpose-chord';
import transposeLines from '../common/transpose-lines';
import SongKey from 'app/common/SongKey';
import Typography from '@material-ui/core/Typography';

import {
	Plus as PlusIcon,
	Minus as MinusIcon,
	Eye as EyeIcon
} from 'mdi-material-ui';

import { linesToNashville } from '../../utils/convertToNashville';
import './SongViewer.scss';

const convertToNashville = ( key, lines ) => {

	const newLines = [];

	console.log( lines );

	lines.forEach( line => {

		const newLine = { ...line };

		if ( line.chords ) {

			const newChords = { ...line.chords };
			delete newChords._sort;

			Object.keys( newChords ).forEach( k => {

				if ( line.chords[ k ] ) {

					newChords[ k ] = getKeyDiff( key, line.chords[ k ] ) + 1;
					if ( includes( [ 2, 3, 7 ], newChords[ k ] ) ) {
						newChords[ k ] += 'm';
					}

				}

			} );

			newLine.chords = { ...newChords, _sort: line.chords._sort };

		}

		newLines.push( newLine );

	} );

	return newLines;

};

class SongViewer extends Component {
	static propTypes = {
		setKey: PropTypes.string
	};

	state = {
		capoAmount: 0,
		isNashville: false,
		isSetListDropdownVisible: false,
		key: '',
		lines: [],
		setList: []
	};

	componentDidMount() {

		// Update an initial list when the component mounts.
		this.updateListOfSets();

		//Set the page title to the song title
		document.title = this.props.song.title;

		// Listen for any changes on the database.
		sync.on( "change", this.updateListOfSets.bind( this ) );

		this.handleProps( this.props );

		const songId = this.props.song._id;
		const setId = this.props.currentSet._id;
		console.log( 'songId', songId );
		console.log( 'setId', setId );

	}

	componentWillReceiveProps( nextProps ) {
		this.handleProps( nextProps );
	}

	componentWillUnmount() {
		sync.cancel();
	}

	addToSet = set => {

		const { song } = this.props;

		db.get( set._id ).then( doc => {

			const data = { ...doc };

			data.songs = data.songs || [];
			data.songs.push( {
				_id: song._id,
				key: song.key
			} );
			data.songs = uniqBy( data.songs, '_id' );

			db.put( data ).then( () => {

				if ( this.props.history ) {

					const location = {
						pathname: `/sets/${doc._id}`
					};

					this.props.history.push( location );
				}

			} ).catch( err => {

				if ( err.name === 'conflict' ) {

					console.error( 'SongList.addToSet: conflict -', err );

				} else {

					console.error( 'SongList.addToSet -', err );

				}

			} );

		} ).catch( err => {
			console.error( err );
		} );

	};

	handleProps = props => {

		const songUser = props.song.users && props.song.users.find( u => u.id === props.user.id ) || {};

		console.log( 'song key', props.song.key );
		console.log( 'set key', props.setKey );
		console.log( 'user key', songUser.key );

		const key = songUser.key || props.setKey || props.song.key;

		const parser = new Parser();
		const lines = parser.parse( props.song.content );

		this.setState( { key, lines } );

	};

	scrollToSection( section ) {

		let totalVertPadding = 32;
		let headerHeight = 92;

		location.href = '#';
		location.href = '#section-' + section.index;

		let scrollBottom = window.innerHeight - document.body.scrollTop + totalVertPadding;

		if ( headerHeight < scrollBottom ) {

			// Go back 92 pixels to offset the header.
			window.scrollBy( 0, -headerHeight );

		}

	}

	changeKey = amount => {
		const key = transposeChord( this.state.key, amount );
		this.props.setCurrentSongUserKey( key );
	};

	setListDropdownHide = () => this.setState( { isSetListDropdownVisible: false } );
	setListDropdownShow = () => this.setState( { isSetListDropdownVisible: true } );
	setListDropdownToggle = () => this.state.isSetListDropdownVisible ?
		this.setListDropdownHide() : this.setListDropdownShow();

	transposeDown = () => this.changeKey( 1 );
	transposeUp = () => this.changeKey( -1 );

	toggleNashville = value => this.setState( prevState => ( {
		isNashville: value !== undefined ? value : !prevState.isNashville
	} ) );

	updateListOfSets = () => Sets.getAll().then( setList => this.setState( { setList } ) );

	render() {

		const {
			isNashville,
			isSetListDropdownVisible,
			key,
			lines: linesState,
			setList
		} = this.state;

		const song = { ...this.props.song };
		const setKey = this.props.setKey || song.key;

		const capo = getKeyDiff( key, setKey ); //this is only for display purposes, telling the user where to put the capo
		const transposeAmount = getKeyDiff( song.key, key ); //this is how much to transpose by

		let lines = transposeLines( linesState, transposeAmount );
		if ( isNashville ) {
			lines = linesToNashville( key, lines );
		}

		let sections = [];

		return (
			song ?
				<div className="song-viewer">
					<Hero>
						<ContentLimiter>
							<Grid container justify="space-between">

								<Grid item>
									<Typography variant="display1"
									            color="inherit">{song.title}</Typography>
									<Typography variant="title">{song.author}</Typography>
								</Grid>

								<Grid item className="column no-print">
									<Grid container spacing={24} alignItems="center">

										<Grid item>
											<Typography>
												Set key
												<SongKey value={this.props.setKey}/>
											</Typography>
											<div className="control">
												<KeySelector
													onSelect={( key, amount ) => this.changeKey( amount )}
													value={key}/>
											</div>
										</Grid>

										<Grid item>
											<Typography>
												Capo {capo}
											</Typography>

											<IconButton aria-label="Transpose down"
											            onClick={this.transposeDown}>
												<MinusIcon/>
											</IconButton>
											<IconButton aria-label="Transpose up"
											            onClick={this.transposeUp}>
												<PlusIcon/>
											</IconButton>

											<IconButton aria-label="Toggle Nashville Numbering"
											            onClick={this.toggleNashville}>
												<EyeIcon/>
											</IconButton>

										</Grid>

										<Grid item>

											<form autoComplete="off">
													<FormControl>
														<InputLabel htmlFor="set">Add to set</InputLabel>

														<Button color="secondary" variant="raised" >
															Add to set
														</Button>

														<Select
															value=""
															onChange={() => this.addToSet( set )}
														>

															{setList.map( set => (
																<MenuItem
																	key={set._id}
																	value={set._id}>
																	{set.title}
																</MenuItem>
															) )}

														</Select>
													</FormControl>
											</form>
										</Grid>

									</Grid>
								</Grid>

								<Grid item className="column no-print">

									{/*<a className="button">Key of {song.key}</a>*/}


									<Grid item>
										<Link to={`/songs/${song._id}/edit`}>
											<Button color="primary" variant="raised">
												Edit Song
											</Button>
										</Link>
									</Grid>


									{/* JL: once we're happy with the material "add to set", we can remove this
										<div className="control">
											<div className={cx(
												'dropdown',
												{ 'is-active': isSetListDropdownVisible }
											)}>
												<div className="dropdown-trigger"
												     onClick={this.setListDropdownToggle}>
													<button className="button"
													        aria-haspopup="true"
													        aria-controls="dropdown-menu">
																<span className="icon is-small">
																	<i className="fa fa-plus-square-o"/>
																</span>
														<span>Add to set</span>
														<span className="icon is-small">
														            <i className="fa fa-angle-down"
														               aria-hidden="true"/>
														        </span>
													</button>
												</div>
												<div className="dropdown-menu"
												     id="set-list-dropdown-menu"
												     onClick={this.setListDropdownHide}
												     role="menu"
												>
													<div className="dropdown-content">
														{setList.map( set => (
															<a className="dropdown-item"
															   key={set._id}
															   onClick={() => this.addToSet( set )}>
																{set.title}
															</a>
														) )}
													</div>

												</div>
											</div>
										</div> */}


								</Grid>
							</Grid>
						</ContentLimiter>
					</Hero>

					<ContentLimiter>
						<section className="section">
							<div className="container">
								<div className="song-viewer__song">
									{parseSong( lines, sections )}
								</div>
							</div>
						</section>
					</ContentLimiter>

				</div>
				: null
		);

	}
}

const mapStateToProps = state => ( {
	currentSet: state.currentSet,
	song: state.currentSong,
	user: state.user
} );

export default connect( mapStateToProps, actions )( SongViewer );

//-----------------------------------------------------

export function parseSong( lines, sections ) {

	let children = [];
	let result = [];
	let section = '';
	let sectionIndex = 0;

	for ( let i = 0; i < lines.length; i++ ) {

		let line = lines[ i ];

		switch ( lines[ i ].type ) {

			case 'chord-line':
				children.push(
					<ChordLine key={i} chords={line.chords}/> );
				break;

			case 'chord-pair':
				children.push(
					<ChordPair key={i} chords={line.chords} text={line.text}/> );
				break;

			case 'empty':
				children.push(
					<div key={i} className="empty-line"/> );
				break;

			case 'line':
				children.push(
					<Line key={i} text={line.text}/> );
				break;

			case 'section':

				if ( section ) {

					// Finish off last section
					result.push(
						<section
							id={`section-${sectionIndex}`}
							key={`section-${sectionIndex}`}
							className="song-viewer__section"
							data-section={section}
						>{children}</section>
					);
					children = [];

				} else {

					result = result.concat( children );

				}

				section = line.text;
				sections.push( {
					title: line.text,
					index: sectionIndex
				} );

				sectionIndex++;

				break;

		}

	} //end of loop through lines

	if ( section ) {

		result.push( <section id={`section-${sectionIndex}`}
		                      key={`section-${sectionIndex}`}
		                      className="song-viewer__section"
		                      data-section={section}>{children}</section> );

	}

	if ( children.length && !section ) {

		result = result.concat( children );

	}

	return result;

}
