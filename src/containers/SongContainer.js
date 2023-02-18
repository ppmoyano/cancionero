import React, { PureComponent } from 'react'
import { connect } from 'react-redux'

import * as actions from '../redux/actions'
import SongViewer from '../components/SongViewer'

class SongContainer extends PureComponent {
	componentDidMount() {
		this.updateCurrentSong()
	}

	componentDidUpdate() {
		this.updateCurrentSong()
	}

	updateCurrentSong = () => {
		if (!this.props.song || this.props.song.id !== this.props.id) {
			this.props.setCurrentSongId(this.props.id)
		}
	}

	render() {
		const { currentSet, currentKey, song, user } = this.props
		return (
			<SongViewer
				currentSet={currentSet}
				setKey={currentKey}
				song={song}
				user={user}
				youtube= {song?.youtube}
			/>
		)
	}
}

const mapStateToProps = (state, ownProps) => ({
	currentSet: state.sets.byId[state.currentSet.id],
	song: state.songs.byId[ownProps.id],
	user: state.user
})

export default connect(
	mapStateToProps,
	actions
)(SongContainer)
