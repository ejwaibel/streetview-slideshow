'use strict';

import { config } from './config';
import { Template } from './Template';

export const utils = {
	directionTimers: [],
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

				if (!address.includes('RETRY')) {
					utils.generateImage(address);
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
				var endDirections = function(location) {
						if (location === destination) {
							utils.generateImage(location);
						} else {
							console.error(location);
						}

						utils.toggleButtons(false);
						config.buttons.$getDirections.spin(false);
						config.buttons.$cancelDirections.disable(true);
					},
					steps, i, timeout;

				if (status === google.maps.DirectionsStatus.OK) {
					steps = result.routes[0].legs[0].steps;
					stepsTotal = steps.length - 1;
					config.$stepsProgress.progressbar('option', 'max', stepsTotal);

					utils.generateImage(origin);
					updateProgress();

					// Only steps in between origin & destination
					for (i = 1; i < stepsTotal; i++) {
						let step = steps[i];

						geocodeDirection(step)
							.always(geocodeCallback);
					}

					timer = setInterval(function() {
						if (stepsCount === stepsTotal) {
							clearInterval(timer);
							endDirections(destination);
						}
					}, 3000);
				} else {
					endDirections(status);
				}
			});
		}

		return true;
	},
	generateImage: function(location) {
		var $imgContainer = $(config.templates.img),
			$streetviewImage = $imgContainer.find(config.elements.streetviewImage),
			imgHeight = config.api.images.width,
			imgWidth = config.api.images.width,
			imgUrl, $img, i;

		config.images.$container.append($imgContainer);
		$imgContainer
			.spin(config.spinOptions)
			.find('.js-location-title')
				.text(location);

		imgUrl = config.templates.streetview.apply({
			location: location,
			imageHeight: imgHeight,
			imageWidth: imgWidth,
			heading: config.sliders.heading.value,
			fov: config.sliders.fov.value,
			pitch: config.sliders.pitch.value
		});

		let imgAttr = {
			crossOrigin: 'anonymous',
			title: location
		};

		// Setup new <img> element with default attributes and
		// append it to image container
		$img = $('<img>', imgAttr)
				.prependTo($streetviewImage)
				.on('load', function() {
					let img64 = utils.getBase64Image(this).substr(0, 64);

					if (config.api.images.noImageRegex.test(img64)) {
						// utils.onRemoveImageClick.call(this);
						$(this).attr(
							'src',
							`https://unsplash.it/g/${imgWidth}/${imgHeight}?blur&random`
						);
					}
				});

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

		return dataURL
				.replace(/^data:image\/(png|jpg);base64,/, '')
				.replace(/iVBORw0KGgoAAAANSUhEUgAAAPEAAADxCAYAAAAay1EJAAA/, '');
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
		var dfd = $.Deferred(),
			options = {
				location: latlng.latitude ?
						new google.maps.LatLng(latlng.latitude, latlng.longitude) :
						latlng
			},
			geocodeCallback = function(results, status) {
				var address = '';

				switch (status) {
					case google.maps.GeocoderStatus.OK:
						try {
							address = results[0].formatted_address;
						} catch (error) {
							dfd.reject(`RETRY - ${options.location} - ${error}`);

							return;
						}

						let isBadAddress = config.api.invalidAddress.test(address),
							isShortAddress = address.lastIndexOf(',') < 3;

						if (isBadAddress || isShortAddress) {
							dfd.reject(`RETRY - INVALID ADDRESS - ${address}`);
						} else {
							dfd.resolve(address);
						}

						break;

					case google.maps.GeocoderStatus.ZERO_RESULTS:
					case google.maps.GeocoderStatus.UNKNOWN_ERROR:
						dfd.reject(`RETRY - ${status}`);
						break;

					case google.maps.GeocoderStatus.OVER_QUERY_LIMIT:
						setTimeout(() => {
							utils.geocoder.geocode(options, geocodeCallback);
						}, 1000);
						break;

					default:
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
	onRemoveImageClick: function() {
		$(this)
			.parents(config.elements.containerImage)
			.off()
			.fadeOut()
			.remove();
	},
	onGetCurrentLocationClick: function(e) {
		var $target = $(e.currentTarget),
			$input = $($target.data('selector'));

		$input.val('');

		$target.disable(true).spin(config.spinOptions);

		navigator.geolocation.getCurrentPosition((pos) => {
			let latlng = {
				latitude: pos.coords.latitude,
				longitude: pos.coords.longitude
			};

			utils.getFormattedAddress(latlng)
				.always(function(data) {
					$target.spin(false);
					$input.val(data);
				});
		});
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
						$input.val(status);

						// Get another address if status is 'RETRY'
						if (status.includes('RETRY')) {
							getRandomAddress(utils.getRandomLatLong());
						}
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
