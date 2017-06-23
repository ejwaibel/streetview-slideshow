// import * as log from 'loglevel';
import { config } from './config';
import { StreetviewImage } from './StreetviewImage';
import { Template } from './Template';

export const utils = {
	addImage(address, options) {
		let streetviewImage = new StreetviewImage(address);

		config.images.list.push({
			id: streetviewImage.id,
			value: streetviewImage
		});

		config.images.$container.append(streetviewImage.$el);
		streetviewImage.generateImage();
	},
	removeImage(id) {
		if (!id) {
			return false;
		}

		let removed = _.remove(config.images.list, function(o) {
				return o.id === id;
			});

		if (removed.length) {
			removed[0].value.destroy();

			return true;
		}

		return false;
	},
	decodeString(url, extras) {
		return window.decodeURIComponent(url);
	},
	encodeString(url, extras) {
		return window.encodeURIComponent(url.replace('\'', '%27'));
	},
	/**
	 * Converts the provided query string to an object containing the params.
	 * If no query string is passed, it will use window.location.search.
	 *
	 * @memberOf gmwp.util
	 * @param {string} [queryString] Optional query string to be converted
	 * @return {object} params Object of key/value pairs for each query parameter
	 */
	getQueryParams: function(queryString) {
		var query = (queryString || window.location.search).substring(1) || '',
			urlStart = query.indexOf('?'),
			p = null,
			pair = null,
			params = null;

		query = urlStart !== -1 ? query.slice(urlStart + 1) : query;

		params = _
				.chain(query.split('&'))
				.map(function(param) {
					p = param.split('=');
					pair = [p[0], utils.decodeString(p[1] || '')];

					return pair;
				})
				.fromPairs()
				.value();

		return !_.isEmpty(query) && params || null;
	},

	/**
	 * Get value by parameter name from a query string.
	 *
	 * @memberOf gmwp.util
	 * @param {string} param Name of query parameter
	 * @param {string} [queryString] Optional query string to search
	 * @return {*} value of param if found, otherwise null
	 */
	getQueryParam: function(param, queryString) {
		var params = this.getQueryParams(queryString);

		return _.get(params, param) || null;
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
					log.error(location);
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
			geocodeDirection = function(step) {
				var start = step.start_location;

				return utils.getFormattedAddress(start);
			},
			getImageFromDirection = function(step, waitDfd) {
				let dfd = waitDfd || $.Deferred();

				geocodeDirection(step)
					.done(function(address) {
						dfd.resolve(address);

						utils.appendImage(address);

						updateProgress();
					})
					.fail(function(status, latlng) {
						log.info('geocode', this);
						let address = utils.getQueryParam('location', this.url);

						if (status.includes('RETRY')) {
							if (status.includes(config.mapsApi.statusCodes.OVER_QUERY_LIMIT)) {
								// Try again with same latlng after waiting 5s
								setTimeout(function() {
									getImageFromDirection(step, dfd);
								}, 5000);

								return;
							}

							dfd.reject(status, latlng);
						}
					});

				return dfd.promise();
			},
			getSteps = function(result) {
				// TODO: Determine best 'step' to return
				let steps = result.routes[0].legs[0].steps;

				// Convert Array into Iterator
				return new Set(steps);
			},
			getNextImage = function(stepIt) {
				let currStep = stepIt.next();

				if (!currStep.done && !config.mapsApi.cancelDirections) {
					getImageFromDirection(currStep.value)
						.done(function() {
							// Wait between each image to prevent API query limit error
							setTimeout(function() {
								getNextImage(stepIt);
							}, 1500);
						})
						.fail(function(status, latlng) {
							log.warn(`ERROR - ${latlng} - ${status}`);
							log.info('addressFromFail', this);
						});
				} else {
					config.mapsApi.cancelDirections = false;
				}
			};

		utils.directionsService.route(request, function(result, status) {
			if (status === config.mapsApi.statusCodes.OK) {
				let steps = getSteps(result),
					stepIt = steps.values(),
					currStep;

				stepsTotal = steps.size;

				config.$stepsProgress.progressbar('option', 'max', stepsTotal);

				getNextImage(stepIt);
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
			config.buttons.$startSlideshow.disable(false);

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
			location = `${latlng.latitude}, ${latlng.longitude}`,
			geocodeCallback = function(results, status) {
				var address = '';

				log.info(results);

				if (!results) {
					log.info(
						config.templates.retryMsg.apply({
							location,
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
									location,
									msg: 'UNKNOWN ADDRESS',
									status: error
								}),
								latlng
							);
						}

						dfd.resolve(address);

						break;

					case config.mapsApi.statusCodes.ZERO_RESULTS:
					case config.mapsApi.statusCodes.UKNOWN_ERROR:
					case config.mapsApi.statusCodes.OVER_QUERY_LIMIT:
						dfd.reject(
							config.templates.retryMsg.apply({
								location,
								msg: 'ERROR',
								status
							}),
							latlng
						);
						break;

					default:
						dfd.reject(status, latlng);
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
			locationImageSuccess = function(results, status, xhr) {
				let location = utils.getQueryParam('location', this.url);

				if (!results.status) {
					$input.val(
						config.templates.retryMsg.apply({
							location,
							msg: 'BAD REQUEST'
						})
					);

					getRandomAddress(utils.getRandomLatLong());
				}

				status = results.status;

				switch (status) {
					case config.mapsApi.statusCodes.OK:
						addressDfd.resolve(location);
						break;

					case config.mapsApi.statusCodes.NOT_FOUND:
					case config.mapsApi.statusCodes.UKNOWN_ERROR:
					case config.mapsApi.statusCodes.ZERO_RESULTS:
						$input.val(
							config.templates.retryMsg.apply({
								location,
								msg: 'BAD IMAGE',
								status
							})
						);

						getRandomAddress(utils.getRandomLatLong());

						break;

					default:
						$input.val(`ERROR - ${location} - ${status}`);
						getRandomAddress(utils.getRandomLatLong());
						break;
				}
			},
			locationImageFail = function(data) {
				addressDfd.reject('ERROR - See Console For Details');
				log.error(data);
			},
			formattedAddressSuccess = function(address) {
				utils.locationHasImage(address)
					.done(locationImageSuccess)
					.fail(locationImageFail);
			},
			formattedAddressFail = function(status, latlng) {
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
					addressDfd.reject(status, latlng);
				}
			},
			/**
			 * Converts the given latitude/longitude values into a human
			 * readable address. Continues to loop if the values given
			 * do not return a valid address.
			 * @param  {Object} latlng
			 */
			getRandomAddress = function(latlng) {
				utils.getFormattedAddress(latlng)
					.done(formattedAddressSuccess)
					.fail(formattedAddressFail);

				return addressDfd.promise();
			},
			getRandomAddressCallback = function(data) {
				let index = isOrigin ? 0 : 1;

				$target
					.disable(false)
					.spin(false);

				config.buttons.$getImage
					.eq(index)
					.disable(false);

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
