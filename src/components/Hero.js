import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';

const styles = theme => ({
	root: theme.mixins.gutters( {
		backgroundColor: theme.heroBackgroundColor,
		color: theme.heroContrastText,
		paddingBottom: theme.spacing.unit * 2,
		paddingTop: theme.spacing.unit * 2,

		'& $Input': {
			color: theme.heroContrastText
		}
	} )
});

const Hero = ( { children, classes } ) => (
	<div className={classes.root}>
		<Grid container className={classes.container}>
			<Grid item xs={12}>
				{children}
			</Grid>
		</Grid>
	</div>
);

export default withStyles( styles )( Hero );