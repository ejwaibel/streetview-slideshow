// import * as log from 'loglevel';
import { config } from './config';
import { StreetviewImage } from './StreetviewImage';
import { Template } from './Template';

export const utils = {
	appendImage(address) {
		let streetviewImage = new StreetviewImage(address);

		config.images.$container.append(streetviewImage.$el);
		streetviewImage.generateImage();
	},
	encodeString(url, extras) {
		return window.encodeURIComponent(url.replace('\'', '%27'));
	},
	directionsService: new google.maps.DirectionsService(),
	geocoder: new google.maps.Geocoder(),
	generateDirections: function(request) {
		let origin = request.origin,
			destination = request.destination,
			stepsCount = 0,
			stepsTotal = 0,
			endDirections = function(location) {
				if (location === destination) {
					utils.appendImage(location);
				} else {
					console.error(location);
				}

				utils.toggleButtons(false);

				config.buttons.$getDirections.spin(false);
				config.buttons.$cancelDirections.disable(true);
			},
			updateProgress = function() {
				stepsCount++;

				config.$stepsProgress
					.progressbar('value', stepsCount)
					.children('.js-steps-label')
						.html(`${stepsCount} of ${stepsTotal}`);

				if (config.$stepsProgress.progressbar('value') === stepsTotal) {
					endDirections(destination);
				}
			},
			geocodeCallback = function(address) {
				updateProgress();

				if (!address.includes('RETRY')) {
					utils.appendImage(address);
				}

				// FIXME: Need to do something here
				// window.alert(address);
			},
			geocodeDirection = function(step) {
				var start = step.start_location;

				return utils.getFormattedAddress(start);
			};

		utils.directionsService.route(request, function(result, status) {
			if (status === google.maps.DirectionsStatus.OK) {
				let steps = result.routes[0].legs[0].steps;

				stepsTotal = steps.length - 1;

				config.$stepsProgress.progressbar('option', 'max', stepsTotal);

				utils.appendImage(origin);

				updateProgress();

				// Only steps in between origin & destination
				for (let i = 1; i < stepsTotal; i++) {
					let currStep = steps[i];

					geocodeDirection(currStep)
						.always(geocodeCallback);
				}
			} else {
				endDirections(status);
			}
		});
	},
	generateDirectionsImages: function() {
		var self = this,
			origin = $('#address-origin').val(),
			destination = $('#address-destination').val();

		if (origin && destination) {
			config.buttons.$startSlideshow.removeAttr('disabled');

			let request = {
				origin: origin,
				destination: destination,
				travelMode: google.maps.TravelMode.DRIVING
			};

			utils.generateDirections(request);
		}
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
				.replace(/iVBORw0KGgoAAAANSUhEUgAAA/, '');
	},

	/**
	 * [getRandom description]
	 * @param  {[type]} from [description]
	 * @param  {[type]} to   [description]
	 * @return {[type]}      [description]
	 */
	getRandom: function(from, to) {
		return Math.random() * (to - from) + from;
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

				log.info(results);

				if (!results) {
					log.info(
						config.templates.retryMsg.apply({
							address: options.location,
							msg: 'ERROR',
							status
						})
					);
				}

				switch (status) {
					case config.mapsApi.statusCodes.OK:
						try {
							address = results[0].formatted_address;
						} catch (error) {
							dfd.reject(
								config.templates.retryMsg.apply({
									address: options.location,
									msg: 'UNKNOWN ADDRESS',
									status: error
								})
							);

							return;
						}

						utils.locationHasImage(address)
							.done((data) => {
								if (!data.status) {
									dfd.reject(
										config.templates.retryMsg.apply({
											address,
											msg: 'BAD REQUEST'
										})
									);
								}

								let status = data.status;

								switch (status) {
									case config.mapsApi.statusCodes.OK:
										dfd.resolve(address);
										break;

									case config.mapsApi.statusCodes.NOT_FOUND:
									case config.mapsApi.statusCodes.UKNOWN_ERROR:
									case config.mapsApi.statusCodes.ZERO_RESULTS:
										dfd.reject(
											config.templates.retryMsg.apply({
												address,
												msg: 'BAD IMAGE',
												status
											})
										);
										break;

									default:
										dfd.reject(`ERROR - ${address} - ${status}`);
										break;
								}
							})
							.fail((data) => {
								dfd.reject('ERROR - See Console For Details');
								console.error(data);
							});

						break;

					case config.mapsApi.statusCodes.ZERO_RESULTS:
					case config.mapsApi.statusCodes.UKNOWN_ERROR:
					case config.mapsApi.statusCodes.OVER_QUERY_LIMIT:
						dfd.reject(
							config.templates.retryMsg.apply({
								address,
								msg: 'ERROR',
								status
							})
						);
						break;

					default:
						dfd.reject(status);
						break;
				}
			};

		log.info(latlng);
		this.geocoder.geocode(options, geocodeCallback);

		return dfd.promise();
	},
	/**
	 * Return a random set of latitude/longitude values that are within
	 * the square bounds for North America
	 * @return {Object}
	 */
	getRandomLatLong: function() {
		var latitudeBoundary = {
				min: 30.09,
				max: 50.02
			},
			longitudeBoundary = {
				min: -125.50,
				max: -70.90
			},
			fixed = 5;

		return {
			// .toFixed() returns string, so ' * 1' is a trick to convert to number
			latitude: (
				utils.getRandom(
					latitudeBoundary.min,
					latitudeBoundary.max)
				).toFixed(fixed) * 1,
			longitude: (
				utils.getRandom(
					longitudeBoundary.min,
					longitudeBoundary.max)
				).toFixed(fixed) * 1
		};
	},
	locationHasImage: function(location) {
		let url = config.templates.streetviewMetadata
					.apply({
						location: utils.encodeString(location)
					});

		return $.getJSON(url);
	},
	randomAddressClickCallback: function(e) {
		var $target = $(e.currentTarget),
			$input = $($target.data('selector')),
			isOrigin = $input.is('#address-origin'),
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
							if (status.includes(config.mapsApi.statusCodes.OVER_QUERY_LIMIT)) {
								// Try again with same latlng after waiting 5s
								setTimeout(function() {
									getRandomAddress(latlng);
								}, 5000);
							} else {
								getRandomAddress(utils.getRandomLatLong());
							}
						} else {
							addressDfd.reject(status);
						}
					});

				return addressDfd.promise();
			},
			getRandomAddressCallback = function(data) {
				let index = isOrigin ? 0 : 1;

				$target
					.disable(false)
					.spin(false);

				config.buttons.$getImage.eq(index).disable(false);

				$input.val(data);
			};

		$input.val('');

		$target
			.disable(true)
			.spin(config.spinOptions);

		config.buttons.$geolocation.disable(true);
		config.buttons.$getImage.eq(isOrigin ? 0 : 1).disable(true);

		// Wait for valid address to be returned
		getRandomAddress(latlong)
			.done(getRandomAddressCallback)
			.fail(getRandomAddressCallback);
	},
	toggleButtons: function(action) {
		_.forOwn(config.buttons, function(value, key) {
			config.buttons[key].disable(action);
		});
	}
};
