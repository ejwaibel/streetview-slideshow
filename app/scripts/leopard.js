/**
 * The 'leopard' namespace
 * @type {Object}
 */
'use strict';

(function() {
	var leopard = {
		api: {
			key: 'AIzaSyB1jk8Ai169dtl2k6kYatTRiU7ul6gZZd4',
			streetview: 'https://maps.googleapis.com/maps/api/streetview?size={{imageWidth}}x{{imageHeight}}&location={{location}}{{#heading}}&heading={{headingValue}}{{/heading}}{{#fov}}&fov={{fovValue}}{{/fov}}{{#pitch}}&pitch={{pitchValue}}{{/pitch}}&key={{key}}'
		},
		buttons: {

		},
		elements: {
			containerSlider: '.js-container-slider',
			imagesContainer: '.js-container-images',
			imageContainer: '.js-container-image',
			slider: '.js-slider',
			sliderValue: '.js-slider-value'
		},
		geocoder: new google.maps.Geocoder(),
		invalidAddress: /(unnamed road)|(^[\w\d\s]+$)|(^\d+\-\d+)|(highway)|(freeway)|(development road)/i,
		images: {
			list: {
				width: 400,
				height: 175
			},
			streetview: {
				width: 1024,
				height: 1024
			}
		},
		latitudeBoundary: {
			min: 28.70,
			max: 48.85
		},
		longitudeBoundary: {
			min: -127.50,
			max: -55.90
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
					var address = results && results.length && results[0] ? results[0].formatted_address : null;

					if (status === google.maps.GeocoderStatus.OK) {
						if (address.search(leopard.invalidAddress) !== -1 ||
							address.match(/\,/g).length < 3) {
							dfd.reject('RETRY');
						} else {
							dfd.resolve(address);
						}
					} else if (status === google.maps.GeocoderStatus.ZERO_RESULTS ||
							status === google.maps.GeocoderStatus.UNKNOWN_ERROR) {
						dfd.reject('RETRY');
					} else if (status === google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
						setTimeout(function() {
							leopard.geocoder.geocode(options, geocodeCallback);
						}, 1200);
					} else {
						dfd.reject(status);
					}
				};

			this.geocoder.geocode(options, geocodeCallback);

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
			var fixed = 5;

			return {
				// .toFixed() returns string, so ' * 1' is a trick to convert to number
				latitude: (this.getRandom(this.latitudeBoundary.min, this.latitudeBoundary.max)).toFixed(fixed) * 1,
				longitude: (this.getRandom(this.longitudeBoundary.min, this.longitudeBoundary.max)).toFixed(fixed) * 1
			};
		}
	};

	window.leopard = leopard;
})();
