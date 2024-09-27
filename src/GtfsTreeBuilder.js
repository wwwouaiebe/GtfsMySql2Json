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

import theMySqlDb from './MySqlDb.js';
import fs from 'fs';

/* ------------------------------------------------------------------------------------------------------------------------- */
/**
 * Coming soon
 */
/* ------------------------------------------------------------------------------------------------------------------------- */

class GtfsTreeBuilder {

	/**
     * Coming soon
     * @type {Object}
     */

	#gtfsTree = {
		networkId : 'L',
		vehicle : 'bus',
		routesMaster : []
	};

	/**
     * Coming soon
     * @type {Object}
     */

	#currentRouteMaster = {};

	/**
     * Coming soon
     * @param {String} shapePk coming soon
     */

	async #selectPlatformsForShape ( shapePk ) {
		const platforms = await theMySqlDb.execSql (
			'SELECT stop_times.stop_sequence AS platformOrder, stops.stop_id AS platformId, stops.stop_name AS platformName, ' +
            'stops.stop_lat AS platformLat ,stops.stop_lon AS platformLon ' +
            'FROM stop_times INNER JOIN stops ON stops.stop_pk = stop_times.stop_pk ' +
            'WHERE stop_times.trip_pk = ' +
            '( SELECT trips.trip_pk FROM trips WHERE trips.shape_pk = ' + shapePk + ' LIMIT 1 ) ' +
            'ORDER BY stop_times.stop_sequence;'
		);
		let route = {
			shapePk : shapePk,
			platforms : []
		};
		for ( let platformsCounter = 0; platformsCounter < platforms.length; platformsCounter ++ ) {
			let platform = platforms [ platformsCounter ];
			route.platforms.push (
				{
					Id : platform.platformId,
					Name : platform.platformName,
					Order : platform.platformOrder,
					Lat : platform.platformLat,
					Lon : platform.platformLon
				}
			);
		}
		this.#currentRouteMaster.routes.push ( route );
	}

	/**
     * Coming soon
     */

	async #selectShapesPkForRouteMaster ( ) {
		const shapesPk = await theMySqlDb.execSql (
			'SELECT DISTINCT trips.shape_pk as shapePk ' +
            'FROM routes JOIN trips ON routes.route_pk = trips.route_pk ' +
            'WHERE routes.agency_id = "' + this.#gtfsTree.networkId + '" ' +
            'AND routes.route_short_name = "' + this.#currentRouteMaster.routeMasterRef + '";'
		);

		for ( let shapesPkCounter = 0; shapesPkCounter < shapesPk.length; shapesPkCounter ++ ) {
			await this.#selectPlatformsForShape ( shapesPk [ shapesPkCounter ].shapePk );
		}
	}

	/**
     * Coming soon
     * @param {String} agencyId Coming soon
     */

	async #selectRoutesMaster ( agencyId ) {
		const routesMaster = await theMySqlDb.execSql (
			'SELECT DISTINCT routes.route_short_name AS routeMasterRef FROM routes ' +
            'WHERE routes.agency_id = "' + agencyId + '";'
		);
		for ( let routesMasterCounter = 0; routesMasterCounter < routesMaster.length; routesMasterCounter ++ ) {
			this.#currentRouteMaster = {
				routeMasterRef : routesMaster [ routesMasterCounter ].routeMasterRef,
				routes : []
			};
			await this.#selectShapesPkForRouteMaster ( );
			this.#gtfsTree.routesMaster.push ( this.#currentRouteMaster );
			console.info ( this.#currentRouteMaster.routeMasterRef );
		}
	}

	/**
	 * The constructor
	 */

	constructor ( ) {
		Object.freeze ( this );
	}

	/**
     * Coming soon
     */

	async build ( ) {
		await this.#selectRoutesMaster ( 'L' );
		fs.writeFileSync ( './json/gtfs.json', JSON.stringify ( this.#gtfsTree ) );
 	}

}

export default GtfsTreeBuilder;

/* --- End of file --------------------------------------------------------------------------------------------------------- */