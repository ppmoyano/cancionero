const path = require( 'path' );
const webpack = require( 'webpack' );
const CopyWebpackPlugin = require( "copy-webpack-plugin" );
const HtmlWebpackPlugin = require( 'html-webpack-plugin' );

module.exports = function () {

	return {
		context: path.resolve(),
		entry:   path.resolve( "src", "index.js" ),
		resolve: {
			modules: [
				path.resolve( "src" ),
				"node_modules"
			],
			alias:   {
				'react':     'preact-compat',
				'react-dom': 'preact-compat'
			}
		},
		output:  {
			path:              path.resolve( 'build' ),
			filename:          '[name].[chunkhash].js',
			publicPath:        '/',
			sourceMapFilename: '[name].[chunkhash].map'
		},
		module:  {
			loaders: [
				{
					test:    /\.js$/,
					exclude: /node_modules/,
					use:     'babel-loader'
				},
				{
					test: /(\.txt|\.onsong)$/,
					use:  'raw-loader'
				}/*,
				{
					test:    /\.(jpe?g|png|gif|svg)$/i,
					loaders: [
						'url?limit=8192',
						'img-loader'
					]
				}*/
			]
		},
		plugins: [
			new CopyWebpackPlugin( [
				{
					from: path.resolve( "src", "assets", "favicon.ico" ),
					to:   "favicon.ico"
				},
				{
					from: path.resolve( "src", "assets" ),
					to:   "assets"
				}
			] ),
			new HtmlWebpackPlugin( {
				chunkSortMode: 'dependency',
				filename:      'index.html',
				template:      'src/index.html'
			} ),
			new webpack.ProvidePlugin( {
				PreactComponent: path.resolve( 'src/globals/component.js' ),
				jsx:             path.resolve( 'src/globals/jsx.js' )
			} )
		]
	};

};
