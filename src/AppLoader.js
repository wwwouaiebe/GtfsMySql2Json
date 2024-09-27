/*
Copyright - 2024 - wwwouaiebe - Contact: https://www.ouaie.be/

This  program is free software;
you can redistribute it and/or modify it under the terms of the
GNU General Public License as published by the Free Software Foundation;
either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/
/*
Changes:
	- v1.0.0:
		- created
*/
/* ------------------------------------------------------------------------------------------------------------------------- */

import GtfsTreeBuilder from './GtfsTreeBuilder.js';
import theConfig from './Config.js';
import theMySqlDb from './MySqlDb.js';

/* ------------------------------------------------------------------------------------------------------------------------- */
/**
 * Coming soon
 */
/* ------------------------------------------------------------------------------------------------------------------------- */

class AppLoader {

	/**
     * The version number
     * @type {String}
     */

	static get #version ( ) { return 'v1.0.0'; }

	/**
     * Coming soon
     * @param {Object} options Coming soon
     */

	#createConfig ( options ) {
		if ( options ) {
			theConfig.dbName = options.dbName;
			theConfig.appDir = process.cwd ( ) + '/node_modules/osmbus2mysql/src';
		}
		else {
			process.argv.forEach (
				arg => {
					const argContent = arg.split ( '=' );
					switch ( argContent [ 0 ] ) {
					case '--dbName' :
						theConfig.dbName = argContent [ 1 ] || theConfig.dbName;
						break;
					case '--version' :
						console.error ( `\n\t\x1b[36mVersion : ${AppLoader.#version}\x1b[0m\n` );
						process.exit ( 0 );
						break;
					default :
						break;
					}
				}
			);
			theConfig.appDir = process.argv [ 1 ];
		}

		// the config is now frozen
		Object.freeze ( theConfig );
	}

	/**
	 * The constructor
	 */

	constructor ( ) {
		Object.freeze ( this );
	}

	/**
	 * Load the app, searching all the needed infos to run the app correctly
	 * @param {Object} options Coming soon
	 */

	async loadApp ( options ) {

		// config
		this.#createConfig ( options );

		console.info ( '\nStarting OsmPtv2GtfsCompare...\n\n' );
		await theMySqlDb.start ( );

		await new GtfsTreeBuilder ( ).build ( );

		await theMySqlDb.end ( );

		// end of the process
		const deltaTime = process.hrtime.bigint ( ) - theConfig.startTime [ 0 ];

		/* eslint-disable-next-line no-magic-numbers */
		const execTime = String ( deltaTime / 1000000000n ) + '.' + String ( deltaTime % 1000000000n ).substring ( 0, 3 );

		console.info ( `\nFiles generated in ${execTime} seconds.` );

		console.info ( '\nOsmPtv2GtfsComparel ended...\n\n' );

	}
}

export default AppLoader;

/* --- End of file --------------------------------------------------------------------------------------------------------- */