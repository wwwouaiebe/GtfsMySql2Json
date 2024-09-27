/*
Copyright - 2023 - wwwouaiebe - Contact: https://www.ouaie.be/

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

/* ------------------------------------------------------------------------------------------------------------------------- */
/**
 * A simple container to store the app configuration
 */
/* ------------------------------------------------------------------------------------------------------------------------- */

class Config {

	/**
	* Coming soon
	@type {Array}
	 */

	startTime = [];

	/**
	 * The name of the db to use
	 * @type {String}
	 */

	dbName;

	/**
	 * The network to use
	 * @type {String}
	 */

	network;

	/**
	 * The constructor
	 */

	constructor ( ) {
		this.dbName = '';
	}

}

/* ------------------------------------------------------------------------------------------------------------------------- */
/**
 * The one and only one instance of Config class. Notice that the object will be froozen directly after reading the parameters
 */
/* ------------------------------------------------------------------------------------------------------------------------- */

const theConfig = new Config;

export default theConfig;

/* --- End of file --------------------------------------------------------------------------------------------------------- */