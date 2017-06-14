import init from './init.js';
import spinner from './libs/jquery.spin.js';
import { leopard } from './leopard.js';
import { Template } from './template.js';

$(function() {
	init();

	var imageTpl = leopard.templates.img,
		slideshowTpl = new Template(leopard.templates.slideshow),
		streetviewTpl = new Template(leopard.api.streetview),
		sliders = {
			$heading: $('#heading-slider'),
			$fov: $('#fov-slider'),
			$pitch: $('#pitch-slider')
		},
		directionTimers = [],
		displayImage = function($container, $image) {
			$container.append($image).spin(false);
		},
		generateDirectionsImages = function() {
			var origin = $('#address-origin').val(),
				destination = $('#address-destination').val(),
				directionsService = new google.maps.DirectionsService(),
				finishedSteps = 0,
				directionsRequest,
				timer,
				geocodeDirection = function(step) {
					var start = step.start_location;

					return leopard.getFormattedAddress(start);
				},
				geocodeCallback = function(address) {
					finishedSteps++;

					if (address !== 'RETRY') {
						generateImage(address);

						return true;
					}

					// FIXME: Need to do something here
					window.alert(address);
				};

			if (origin && destination) {
				directionsRequest = {
					origin: origin,
					destination: destination,
					travelMode: google.maps.TravelMode.DRIVING
				};

				directionsService.route(directionsRequest, function(result, status) {
					var steps, i, timeout;

					if (status === google.maps.DirectionsStatus.OK) {
						steps = result.routes[0].legs[0].steps;

						generateImage(origin);
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
								generateImage(destination);
								toggleButtons(false);
								leopard.buttons.$getDirections.spin(false);
								leopard.buttons.$cancelDirections.disable(true);
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
		generateImage = function(location) {
			var $imgContainer = $(imageTpl),
				imgUrl, $img, i;

			$(leopard.elements.imagesContainer).append($imgContainer);
			$imgContainer.spin(leopard.spinOptions);

			imgUrl = streetviewTpl.apply({
				location: location,
				heading: true,
				headingValue: getSliderValue('$heading'),
				imageWidth: leopard.images.streetview.width,
				imageHeight: leopard.images.streetview.width,
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
		getDirectionsCallback = function(e) {
			e.preventDefault();

			toggleButtons(true);
			leopard.buttons.$getDirections.spin(leopard.spinOptions);
			leopard.buttons.$cancelDirections.disable(false);

			generateDirectionsImages();

			return;
		},
		getSliderValue = function(name) {
			return parseInt(sliders[name].slider('value'), 10);
		},
		randomAddressClickCallback = function(e) {
			var $element = $(e.target),
				$target = $element.attr('data-selector') ? $element : $element.parents('.button'),
				$input = $($target.data('selector')),
				latlong = leopard.getRandomLatLong(),
				addressDfd = $.Deferred(),
				/**
				 * Converts the given latitude/longitude values into a human
				 * readable address. Continues to loop if the values given
				 * do not return a valid address.
				 * @param  {Object} latlng
				 */
				getRandomAddress = function(latlng) {
					leopard.getFormattedAddress(latlng)
						.done(function(results) {
							addressDfd.resolve(results);
						})
						.fail(function(status) {
							if (status === 'RETRY') {
								getRandomAddress(leopard.getRandomLatLong());
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

			$target.disable(true).spin(leopard.spinOptions);

			// Wait for valid address to be returned
			getRandomAddress(latlong);

			addressDfd
				.done(getRandomAddressCallback)
				.fail(getRandomAddressCallback);
		},
		toggleButtons = function(action) {
			Object.getOwnPropertyNames(leopard.buttons).forEach(function(key) {
				if (leopard.buttons.hasOwnProperty(key)) {
					leopard.buttons[key].disable(action);
				};
			});

			return true;
		};

	/**
	 * [description]
	 * @param  {[type]} e [description]
	 * @return {[type]}   [description]
	 */
	leopard.buttons.$randomAddress.on('click', randomAddressClickCallback);

	/**
	 * Get image from address button
	 */
	leopard.buttons.$getImage.on('click', function(e) {
		var $element = $(e.target),
			$target = $element.attr('data-selector') ? $element : $element.parent(),
			$input = $($target.data('selector')),
			address = $input.val();

		generateImage(address);
	});

	/**
	 * Form submit functionality
	 */
	$('form').on('submit', getDirectionsCallback);

	/**
	 * Cancel directions button
	 */
	leopard.buttons.$cancelDirections.on('click', function() {
		var $this = $(this),
			i;

		// Stop all running directions setTimeout calls
		for (i = 0; i < directionTimers.length; i++) {
			clearTimeout(directionTimers[i]);
		}

		leopard.buttons.$getDirections.spin(false);
		toggleButtons(false);

		directionTimers = [];

		$this.disable(true);
	});

	leopard.buttons.$startSlideshow.on('click', function(e) {
		var $images = $(leopard.elements.streetviewImage).clone(),
			slides = $images.map(function(index, el) {
				return el.outerHTML;
			}).toArray(),
			$scroller = $(slideshowTpl.apply({ slides: slides })),
			$dialog = $(leopard.elements.dialog);

		e.preventDefault();

		$dialog
			.empty()
			.append($scroller);
	});

	/**
	 * Remove image icon
	 */
	$(leopard.elements.imagesContainer).on('click', '.js-remove-image', function() {
		$(this).parents('.js-container-image').off().fadeOut().remove();
	});
});
