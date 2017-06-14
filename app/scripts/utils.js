'use strict';

import { config } from './config';
import { Template } from './template';

export const utils = {
	invalidAddress: /(unnamed road)|(^[\w\d\s]+$)|(^\d+\-\d+)|(highway)|(freeway)|(development road)/i,
	geocoder: new google.maps.Geocoder(),
	generateImage: function(location) {
		var sliders = { // FIXME
				$heading: $('#heading-slider'),
				$fov: $('#fov-slider'),
				$pitch: $('#pitch-slider')
			},
			imageTpl = config.templates.img,
			$imgContainer = $(imageTpl),
			displayImage = function($container, $image) {
				$container.append($image).spin(false);
			},
			getSliderValue = function(name) {
				return parseInt(sliders[name].slider('value'), 10);
			},
			streetviewTpl = new Template(config.api.streetview),
			imgUrl, $img, i;

		$(config.elements.imagesContainer).append($imgContainer);
		$imgContainer.spin(config.spinOptions);

		imgUrl = streetviewTpl.apply({
			location: location,
			heading: true,
			headingValue: getSliderValue('$heading'),
			imageWidth: config.images.streetview.width,
			imageHeight: config.images.streetview.width,
			fov: true,
			fovValue: getSliderValue('$fov'),
			pitch: true,
			pitchValue: getSliderValue('$pitch')
		});

		$img = $('<img>', {
			class: 'streetview-image',
			src: imgUrl,
			title: location
		});

		// Hack because $img.load() is too fast
		setTimeout(displayImage, 500, $imgContainer, $img);

		return;
	},
	/**
	 * Code taken from MatthewCrumley (http://stackoverflow.com/a/934925/298479)
	 */
	getBase64Image: function(img) {
		// Create an empty canvas element
		var canvas = document.createElement('canvas'),
			ctx;

		canvas.width = img.width;
		canvas.height = img.height;

		// Copy the image contents to the canvas
		ctx = canvas.getContext('2d');
		ctx.drawImage(img, 0, 0);

		// Get the data-URL formatted image
		// Firefox supports PNG and JPEG. You could check img.src to guess the
		// original format, but be aware the using 'image/jpg' will re-encode the image.
		var dataURL = canvas.toDataURL('image/png');

		return dataURL.replace(/^data:image\/(png|jpg);base64,/, '');
	},
	/**
	 * Converts the given latitude/longitude values into a human
	 * @param  {Object} latlng [description]
	 * @return {Deferred} dfd    [description]
	 */
	getFormattedAddress: function(latlng) {
		var self = this,
			dfd = $.Deferred(),
			options = {
				location: latlng.latitude ? new google.maps.LatLng(latlng.latitude, latlng.longitude) : latlng
			},
			geocodeCallback = function(results, status) {
				var address = results && results.length && results[0] ? results[0].formatted_address : null;

				if (status === google.maps.GeocoderStatus.OK) {
					if (address.search(self.invalidAddress) !== -1 ||
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
						self.geocoder.geocode(options, geocodeCallback);
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
		var latitudeBoundary = {
				min: 28.70,
				max: 48.85
			},
			longitudeBoundary = {
				min: -127.50,
				max: -55.90
			},
			fixed = 5;

		return {
			// .toFixed() returns string, so ' * 1' is a trick to convert to number
			latitude: (
				this.getRandom(
					latitudeBoundary.min,
					latitudeBoundary.max)
				).toFixed(fixed) * 1,
			longitude: (
				this.getRandom(
					longitudeBoundary.min,
					longitudeBoundary.max)
				).toFixed(fixed) * 1
		};
	},
	toggleButtons: function(action) {
		Object.getOwnPropertyNames(config.buttons).forEach(function(key) {
			if (config.buttons.hasOwnProperty(key)) {
				config.buttons[key].disable(action);
			};
		});

		return true;
	}
};
