/**
 * The 'leopard' namespace
 * @type {Object}
 */
'use strict';

(function() {
	var leopard = {
		api: {
			key: 'AIzaSyCbPuQGIShYS-IYU1T6eIfhxH9yc-8biCg',
			direcctions: '',
			streetview: 'https://maps.googleapis.com/maps/api/streetview?size={{width}}x{{height}}&location={{location}}{{#heading}}&heading={{heading}}{{/heading}}{{#fov}}&fov={{fov}}{{/fov}}{{#pitch}}&pitch={{pitch}}{{/pitch}}&key={{key}}'
		},
		images: {
			width: 250,
			height: 250
		},
		getRandom: function(from, to) {
			return Math.random() * (to - from) + from;
		},
		getRandomLatLong: function() {
			var fixed = 3;

			// .toFixed() returns string, so ' * 1' is a trick to convert to number
		    return {
		    	latitude: (this.getRandom(-90, 90)).toFixed(fixed) * 1,
		    	longitude: (this.getRandom(-180, 180)).toFixed(fixed) * 1
		    };
		}
	};

	window.leopard = leopard;
})();
