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
		getRandomLatLong: function(from, to, fixed) {
			// .toFixed() returns string, so ' * 1' is a trick to convert to number
		    return {
		    	latitude: (Math.random() * (to - from) + from).toFixed(fixed) * 1,
		    	longitude: (Math.random() * (to - from) + from).toFixed(fixed) * 1
		    }
		}
	};

	window.leopard = leopard;
})();
