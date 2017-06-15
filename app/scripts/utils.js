'use strict';

import { config } from './config';
import { Template } from './Template';

export const utils = {
	directionTimers: [],
	invalidAddress: /(unnamed road)|(^[\w\d\s]+$)|(^\d+\-\d+)|(highway)|(freeway)|(development road)/i,
	geocoder: new google.maps.Geocoder(),
	generateDirectionsImages: function() {
		var self = this,
			origin = $('#address-origin').val(),
			destination = $('#address-destination').val(),
			directionsService = new google.maps.DirectionsService(),
			$stepCount = $(config.elements.stepCount),
			$stepTotal = $(config.elements.stepTotal),
			stepsCount = 0,
			stepsTotal = 0,
			directionsRequest,
			timer,
			updateProgress = function() {
				stepsCount++;
				config.$stepsProgress
					.progressbar('value', stepsCount)
					.children('.js-steps-label')
						.html(`${stepsCount} of ${stepsTotal}`);
			},
			geocodeDirection = function(step) {
				var start = step.start_location;

				return utils.getFormattedAddress(start);
			},
			geocodeCallback = function(address) {
				updateProgress();

				if (address !== 'RETRY') {
					utils.generateImage(address);

					return true;
				}

				// FIXME: Need to do something here
				// window.alert(address);
			};

		if (origin && destination) {
			config.buttons.$startSlideshow.removeAttr('disabled');

			directionsRequest = {
				origin: origin,
				destination: destination,
				travelMode: google.maps.TravelMode.DRIVING
			};

			directionsService.route(directionsRequest, function(result, status) {
				var steps, i, timeout;

				if (status === google.maps.DirectionsStatus.OK) {
					steps = result.routes[0].legs[0].steps;
					stepsTotal = steps.length;
					config.$stepsProgress.progressbar('option', 'max', stepsTotal);

					utils.generateImage(origin);
					updateProgress();

					// Only steps in between origin & destination
					for (i = 1; i < stepsTotal - 1; i++) {
						// Ensure we don't exceed the 5 queries per second limit
						timeout = setTimeout(function(step) {
							geocodeDirection(step)
								.always(geocodeCallback);
							// TODO: Add failback for image from directions
						}, (i + 1) * 1500, steps[i]);

						self.directionTimers.push(timeout);
					}

					timer = setInterval(function() {
						if (stepsCount === stepsTotal - 1) {
							clearInterval(timer);
							utils.generateImage(destination);
							utils.toggleButtons(false);
							config.buttons.$getDirections.spin(false);
							config.buttons.$cancelDirections.disable(true);
						}
					}, 3000);
				} else {
					config.images.$container.append('<div>ERROR DIRECTIONS</div>');
					utils.toggleButtons(false);
					config.buttons.$getDirections.spin(false);
					config.buttons.$cancelDirections.disable(true);
				}
			});
		}

		return true;
	},
	generateImage: function(location) {
		var $imgContainer = $(config.templates.img),
			displayImage = function($container, $image) {
				$container.append($image).spin(false);
			},
			headingValue = config.sliders.heading.value,
			fovValue = config.sliders.fov.value,
			pitchValue = config.sliders.pitch.value,
			imgUrl, $img, i;

		config.images.$container.append($imgContainer);
		$imgContainer.spin(config.spinOptions);

		imgUrl = config.templates.streetview.apply({
			location: location,
			heading: headingValue !== config.api.defaults.heading,
			headingValue: headingValue,
			imageWidth: config.api.images.width,
			imageHeight: config.api.images.width,
			fov: fovValue !== config.api.defaults.fov,
			fovValue: fovValue,
			pitch: pitchValue !== config.api.defaults.pitch,
			pitchValue: pitchValue
		});

		// Setup new <img> element with default attributes and
		// append it to image container
		$img = $('<img>', {
			class: 'streetview-image',
			title: location
		}).appendTo($imgContainer);

		// Get the URL to the image and once that finishes, set the same URL on the
		// image and stop the spinner on image container
		$.get(imgUrl)
			.done(function() {
				$img.attr('src', imgUrl);
			})
			.fail(function() {
				$img.attr('src', 'https://blog.sqlauthority.com/i/a/errorstop.png');
			})
			.always(function() {
				$imgContainer.spin(false);
			});
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
	getDirectionsCallback: function(e) {
		e.preventDefault();

		utils.toggleButtons(true);
		config.buttons.$getDirections.spin(config.spinOptions);
		config.buttons.$cancelDirections.disable(false);

		utils.generateDirectionsImages();

		return;
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
				location: latlng.latitude ?
						new google.maps.LatLng(latlng.latitude, latlng.longitude) :
						latlng
			},
			geocodeCallback = function(results, status) {
				var address = results && results.length && results[0] ?
							results[0].formatted_address : null;

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
	randomAddressClickCallback: function(e) {
		var $element = $(e.target),
			$target = $element.attr('data-selector') ? $element : $element.parents('.button'),
			$input = $($target.data('selector')),
			latlong = utils.getRandomLatLong(),
			addressDfd = $.Deferred(),
			/**
			 * Converts the given latitude/longitude values into a human
			 * readable address. Continues to loop if the values given
			 * do not return a valid address.
			 * @param  {Object} latlng
			 */
			getRandomAddress = function(latlng) {
				utils.getFormattedAddress(latlng)
					.done(function(results) {
						addressDfd.resolve(results);
					})
					.fail(function(status) {
						if (status === 'RETRY') {
							getRandomAddress(utils.getRandomLatLong());
						}

						addressDfd.fail(status);
					});

				return addressDfd.promise();
			},
			getRandomAddressCallback = function(data) {
				$target.disable(false).spin(false);
				$input.val(data);
			};

		$input.val('');

		$target.disable(true).spin(config.spinOptions);

		// Wait for valid address to be returned
		getRandomAddress(latlong)
			.done(getRandomAddressCallback)
			.fail(getRandomAddressCallback);
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
