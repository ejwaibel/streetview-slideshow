/**
 * The 'leopard' namespace
 * @type {Object}
 */
'use strict';

(function() {
	var leopard = {
		api: {
			key: 'AIzaSyB1jk8Ai169dtl2k6kYatTRiU7ul6gZZd4',
			streetview: 'https://maps.googleapis.com/maps/api/streetview?size=400x400&location={{location}}{{#heading}}&heading={{heading}}{{/heading}}{{#fov}}&fov={{fov}}{{/fov}}{{#pitch}}&pitch={{pitch}}{{/pitch}}&key={{key}}'
		},
		images: {
			width: 400,
			height: 175
		},
		getRandom: function(from, to) {
			return Math.random() * (to - from) + from;
		},
		/**
		 * Return a random set of latitude/longitude values that are within
		 * the square bounds for North America
		 * @return {Object}
		 */
		getRandomLatLong: function() {
			var fixed = 3;

			return {
				// .toFixed() returns string, so ' * 1' is a trick to convert to number
				latitude: (this.getRandom(28.70, 48.85)).toFixed(fixed) * 1,
				longitude: (this.getRandom(-127.50, -55.90)).toFixed(fixed) * 1
			};
		}
	};

	window.leopard = leopard;
})();
