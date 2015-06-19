/**
 * The 'leopard' namespace
 * @type {Object}
 */
'use strict';

(function() {
	var leopard = {
		api: {
			key: 'AIzaSyB1jk8Ai169dtl2k6kYatTRiU7ul6gZZd4',
			streetview: 'https://maps.googleapis.com/maps/api/streetview?size=400x400&location={{location}}{{#heading}}&heading={{headingValue}}{{/heading}}{{#fov}}&fov={{fovValue}}{{/fov}}{{#pitch}}&pitch={{pitchValue}}{{/pitch}}&key={{key}}'
		},
		geocoder: new google.maps.Geocoder(),
		invalidAddress: /(^unnamed road)|(^[\w\d\s]+$)/i,
		images: {
			width: 400,
			height: 175
		},
		/**
		 * Converts the given latitude/longitude values into a human
		 * @param  {Object} latlng [description]
		 * @return {Deferred} dfd    [description]
		 */
		getFormattedAddress: function(latlng) {
			var dfd = $.Deferred(),
				options = {
					location: latlng.latitude ? new google.maps.LatLng(latlng.latitude, latlng.longitude) : latlng
				},
				geocodeCallback = function(results, status) {
					console.debug('results', results);
					console.debug('status', status);
					var address = results && results.length && results[0] ? results[0].formatted_address : null;

					console.debug('address', address);

					if (status === google.maps.GeocoderStatus.OK) {
						if (address.search(leopard.invalidAddress) !== -1 ||
							address.match(/\,/g).length < 3) {
							console.debug('REJECT - RETRY -- ' + address);
							dfd.reject('RETRY');
						} else {
							console.debug('RESOLVE -- ' + address);
							dfd.resolve(address);
						}
					} else if (status === google.maps.GeocoderStatus.ZERO_RESULTS ||
							status === google.maps.GeocoderStatus.UNKNOWN_ERROR) {
						console.debug('REJECT - RETRY -- ' + address);
						dfd.reject('RETRY');
					} else if (status === google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
						console.debug('LIMIT : WAIT -- ' + options.location);
						setTimeout(function() {
							console.debug('WAIT : END -- ' + options.location);
							leopard.geocoder.geocode(options, geocodeCallback);
						}, Math.random() * 2000);
					} else {
						console.debug('REJECT - ' + status + ' -- ' + address);
						dfd.reject(status);
					}
				};

			console.debug('options', options);
			leopard.geocoder.geocode(options, geocodeCallback);
			// Ensure we don't exceed the 5 queries per second limit
			// setTimeout(function() {
			// 	leopard.geocoder.geocode(options, geocodeCallback);
			// }, 1500);

			return dfd.promise();
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
