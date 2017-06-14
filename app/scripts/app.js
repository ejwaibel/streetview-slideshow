import init from './init';
import spinner from './libs/jquery.spin';
import { config } from './config';
import { utils } from './utils';
import { Template } from './template';

$(function() {
	init();

	var slideshowTpl = new Template(config.templates.slideshow),
		directionTimers = [],
		generateDirectionsImages = function() {
			var origin = $('#address-origin').val(),
				destination = $('#address-destination').val(),
				directionsService = new google.maps.DirectionsService(),
				finishedSteps = 0,
				directionsRequest,
				timer,
				geocodeDirection = function(step) {
					var start = step.start_location;

					return utils.getFormattedAddress(start);
				},
				geocodeCallback = function(address) {
					finishedSteps++;

					if (address !== 'RETRY') {
						utils.generateImage(address);

						return true;
					}

					// FIXME: Need to do something here
					window.alert(address);
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

						utils.generateImage(origin);
						finishedSteps++;

						// Only steps in between origin & destination
						for (i = 1; i < steps.length - 1; i++) {
							// Ensure we don't exceed the 5 queries per second limit
							timeout = setTimeout(function(step) {
								geocodeDirection(step)
									.always(geocodeCallback);
								// TODO: Add failback for image from directions
							}, (i + 1) * 1500, steps[i]);

							directionTimers.push(timeout);
						}

						timer = setInterval(function() {
							if (finishedSteps === steps.length - 1) {
								clearInterval(timer);
								utils.generateImage(destination);
								utils.toggleButtons(false);
								config.buttons.$getDirections.spin(false);
								config.buttons.$cancelDirections.disable(true);
							}
						}, 3000);
					} else {
						// TODO: Display error message
					}
				});
			} else {
				// TODO: Throw error 'origin & destination are required'
			}

			return true;
		},
		getDirectionsCallback = function(e) {
			e.preventDefault();

			utils.toggleButtons(true);
			config.buttons.$getDirections.spin(config.spinOptions);
			config.buttons.$cancelDirections.disable(false);

			generateDirectionsImages();

			return;
		},
		randomAddressClickCallback = function(e) {
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
							} else {
								addressDfd.fail(status);
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
			getRandomAddress(latlong);

			addressDfd
				.done(getRandomAddressCallback)
				.fail(getRandomAddressCallback);
		};

	/**
	 * [description]
	 * @param  {[type]} e [description]
	 * @return {[type]}   [description]
	 */
	config.buttons.$randomAddress.on('click', randomAddressClickCallback);

	/**
	 * Get image from address button
	 */
	config.buttons.$getImage.on('click', function(e) {
		var $element = $(e.target),
			$target = $element.attr('data-selector') ? $element : $element.parent(),
			$input = $($target.data('selector')),
			address = $input.val();

		utils.generateImage(address);
	});

	/**
	 * Form submit functionality
	 */
	$('form').on('submit', getDirectionsCallback);

	/**
	 * Cancel directions button
	 */
	config.buttons.$cancelDirections.on('click', function() {
		var $this = $(this),
			i;

		// Stop all running directions setTimeout calls
		for (i = 0; i < directionTimers.length; i++) {
			clearTimeout(directionTimers[i]);
		}

		config.buttons.$getDirections.spin(false);
		utils.toggleButtons(false);

		directionTimers = [];

		$this.disable(true);
	});

	config.buttons.$startSlideshow.on('click', function(e) {
		var $images = $(config.elements.streetviewImage).clone(),
			slides = $images.map(function(index, el) {
				return el.outerHTML;
			}).toArray(),
			$scroller = $(slideshowTpl.apply({ slides: slides })),
			$dialogContent = $(config.elements.dialogContent);

		e.preventDefault();

		$dialogContent
			.empty()
			.append($scroller);
	});

	/**
	 * Remove image icon
	 */
	$(config.elements.imagesContainer).on('click', '.js-remove-image', function() {
		$(this).parents('.js-container-image').off().fadeOut().remove();
	});
});
