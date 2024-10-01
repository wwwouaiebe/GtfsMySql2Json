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
import PolylineEncoder from './PolylineEncoder.js';
import theConfig from './Config.js';

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
		networkId : theConfig.network,
		startDate : '',
		routesMaster : []
	};

	/**
     * Coming soon
     * @type {Object}
     */

	#polylineEncoder;

	/**
     * Coming soon
     * @type {Object}
     */

	/**
     * Coming soon
     * @type {Object}
     */

	#currentRouteMaster = {};

	/**
     * Coming soon
     * @param { String} shapePk Coming soon
     * @returns {String} coming soon
     */

	async #getNodes ( shapePk ) {
		const nodes = await theMySqlDb.execSql (
			'SELECT shapes.shape_pt_lat AS lat, shapes.shape_pt_lon AS lon ' +
            'FROM shapes WHERE shapes.shape_pk = ' + shapePk + ' ' +
            'ORDER BY shapes.shape_pk, shapes.shape_pt_sequence;'
		);

		let nodesArray = [];
		nodes.forEach (
			node => nodesArray.push ( [ Number.parseFloat ( node.lat ), Number.parseFloat ( node.lon ) ] )
		);

		// eslint-disable-next-line no-magic-numbers
		return this.#polylineEncoder.encode ( nodesArray, [ 6, 6 ] );
	}

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
            '( SELECT trips.trip_pk FROM trips WHERE trips.shape_pk = ' + shapePk.shapePk + ' LIMIT 1 ) ' +
            'ORDER BY stop_times.stop_sequence;'
		);
		let route = {
			platforms : [],
			nodes : '',
			shapePk : shapePk.shapePk,
			startDate : shapePk.minStartDate,
			endDate : shapePk.minStartDate
		};
		for ( let platformsCounter = 0; platformsCounter < platforms.length; platformsCounter ++ ) {
			let platform = platforms [ platformsCounter ];
			route.platforms.push (
				{
					id : platform.platformId,
					name : platform.platformName,
					lat : Number.parseFloat ( platform.platformLat ),
					lon : Number.parseFloat ( platform.platformLon )
				}
			);
		}
		route.nodes = await this.#getNodes ( shapePk.shapePk );
		this.#currentRouteMaster.routes.push ( route );
	}

	/**
     * Coming soon
     */

	async #selectShapesPkForRouteMaster ( ) {
		const shapesPk = await theMySqlDb.execSql (

			'SELECT ' +
				'min(t.start_date) AS minStartDate,' +
				'max(t.end_date) AS maxEndDate, ' +
				't.route_pk AS routePk, ' +
				't.shape_pk AS shapePk ' +
				'FROM ' +
					'( ' +
						'SELECT DISTINCT ' +
						'calendar.start_date AS start_date, ' +
						'calendar.end_date AS end_date, ' +
						'routes.route_pk AS route_pk, ' +
						'trips.shape_pk AS shape_pk ' +
						'FROM ' +
						'( ' +
							'(routes JOIN trips ON ((routes.route_pk = trips.route_pk)) ' +
						') ' +
						'JOIN calendar ' +
						'ON ((trips.service_pk = calendar.service_pk)) ' +
					') ' +
					'WHERE routes.agency_id = "' + theConfig.network + '" ' +
					'AND routes.route_short_name ="' + this.#currentRouteMaster.routeMasterRef + '" ' +
				')  t ' +
				'GROUP BY ' +
				'shapePk ' +
				'ORDER BY minStartDate,maxEndDate;'
		);

		for ( let shapesPkCounter = 0; shapesPkCounter < shapesPk.length; shapesPkCounter ++ ) {
			await this.#selectPlatformsForShape ( shapesPk [ shapesPkCounter ] );
		}
	}

	/**
     * Coming soon
     */

	async #selectRoutesMaster ( ) {
		let routesMaster = await theMySqlDb.execSql (
			'SELECT DISTINCT routes.route_short_name AS routeMasterRef, routes.route_type as routeMasterType FROM routes ' +
            'WHERE routes.agency_id = "' + theConfig.network + '";'
		);
		routesMaster.sort (
			( first, second ) => {

				// split the name into the numeric part and the alphanumeric part:
				// numeric part
				let firstPrefix = String ( Number.parseInt ( first.routeMasterRef ) );
				let secondPrefix = String ( Number.parseInt ( second.routeMasterRef ) );

				// alpha numeric part
				let firstPostfix = ( first.routeMasterRef ).replace ( firstPrefix, '' );
				let secondPostfix = ( second.routeMasterRef ).replace ( secondPrefix, '' );

				// complete the numeric part with spaces on the left and compare
				let result =
					( firstPrefix.padStart ( 5, ' ' ) + firstPostfix )
						.localeCompare ( secondPrefix.padStart ( 5, ' ' ) + secondPostfix );

				return result;
			}
		);
		for ( let routesMasterCounter = 0; routesMasterCounter < routesMaster.length; routesMasterCounter ++ ) {
			this.#currentRouteMaster = {
				routeMasterRef : routesMaster [ routesMasterCounter ].routeMasterRef,
				routeMasterType : Number.parseInt ( routesMaster [ routesMasterCounter ].routeMasterType ),
				routes : []
			};
			await this.#selectShapesPkForRouteMaster ( );
			this.#gtfsTree.routesMaster.push ( this.#currentRouteMaster );
			console.info ( this.#currentRouteMaster.routeMasterRef );
		}
	}

	/**
     * Coming soon
     */

	#removeDuplicateRoutes ( ) {
		this.#gtfsTree.routesMaster.forEach (
			routeMaster => {
				let routesMap = new Map ( );
				routeMaster.routes.forEach (
					route => {
						let platformKey = '';
						route.platforms.forEach (
							platform => {
								platformKey += platform.id;
							}
						);
						let routeKey = platformKey + route.nodes;
						if ( ! routesMap.get ( routeKey ) ) {
							routesMap.set ( routeKey, route );
						}
					}
				);
				routeMaster.routes = [];

				routesMap.forEach (
					route => { routeMaster.routes.push ( route ); }
				);

			}
		);
	}

	/**
     * Coming soon
     * @returns {String} Coming soon
     */

	async #getStartDate ( ) {
		let startDate = await theMySqlDb.execSql ( 'SELECT feed_info.feed_start_date as startDate FROM feed_info LIMIT 1' );
		if ( 0 < startDate.length && startDate [ 0 ].startDate ) {
		    return startDate [ 0 ].startDate;
		}
		return '???';
	}

	/**
	 * The constructor
	 */

	constructor ( ) {
		this.#polylineEncoder = new PolylineEncoder ( );
		Object.freeze ( this );
	}

	/**
     * Coming soon
     */

	async build ( ) {
		this.#gtfsTree.startDate = await this.#getStartDate ( );
		await this.#selectRoutesMaster ( );
		this.#removeDuplicateRoutes ( );
		fs.writeFileSync ( './json/gtfs-' + theConfig.network + '.json', JSON.stringify ( this.#gtfsTree ) );
 	}

}

export default GtfsTreeBuilder;

/* --- End of file --------------------------------------------------------------------------------------------------------- */