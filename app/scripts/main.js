'use strict';

(function($, leopard) {
	var imageTpl = new leopard.tpl($('#tpl-image-container').html()),
		streetviewTpl = new leopard.tpl(leopard.api.streetview),
		sliders = {
			$heading: $('#heading-slider'),
			$fov: $('#fov-slider'),
			$pitch: $('#pitch-slider')
		},
		$directionsCancelBtn = $('form .js-cancel-directions'),
		$directionsBtn = $('form .js-get-directions'),
		$getImageBtn = $('form .js-get-image'),
		$randomAddressBtn = $('form .js-random-address'),
		directionTimers = [],
		displayImage = function($container, $image) {
			$container.spin(false).append($image);
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

					window.alert('ERROR');
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
								$directionsBtn.removeClass('disabled').spin(false);
								$directionsCancelBtn.addClass('disabled');
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
			var $imgContainer = $(imageTpl.apply()),
				imgUrl, $img, i;

			$(leopard.elements.imagesContainer).append($imgContainer);
			$imgContainer.spin('medium');

			imgUrl = streetviewTpl.apply({
				key: leopard.api.key,
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
				src: imgUrl,
				height: leopard.images.list.height,
				width: leopard.images.list.width,
				title: location
			});

			$img.load(displayImage.call(this, $imgContainer, $img));

			return;
		},
		getDirectionsCallback = function(e) {
			e.preventDefault();

			if ($directionsBtn.hasClass('disabled')) {
				return false;
			}

			$directionsBtn.addClass('disabled').spin('medium', 100);
			$directionsCancelBtn.removeClass('disabled');

			generateDirectionsImages();

			return;
		},
		getSliderValue = function(name) {
			return parseInt(sliders[name].slider('value'), 10);
		};

	/**
	 * [description]
	 * @param  {[type]} e [description]
	 * @return {[type]}   [description]
	 */
	$randomAddressBtn.on('click', function(e) {
		var $element = $(e.target),
			$target = $element.attr('data-selector') ? $element : $element.parent(),
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
			randomAddressCallback = function(data) {
				$target.spin(false);
				$target.removeClass('disabled');
				$input.val(data);
			};

		if ($target.hasClass('disabled')) {
			return false;
		}

		$input.val('');

		$target.addClass('disabled').spin('small', 100);

		// Wait for valid address to be returned
		getRandomAddress(latlong);

		addressDfd
			.done(randomAddressCallback)
			.fail(randomAddressCallback);
	});

	/**
	 * Get image from address button
	 */
	$getImageBtn.on('click', function(e) {
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
	$directionsCancelBtn.on('click', function() {
		var $this = $(this),
			i;

		if ($this.hasClass('disabled')) {
			return false;
		}

		// Get all running directions timers
		for (i = 0; i < directionTimers.length; i++) {
			clearTimeout(directionTimers[i]);
		}
	});

	/**
	 * Remove image icon
	 */
	$(leopard.elements.imagesContainer).on('click', '.js-remove-image', function() {
		$(this).parents('.js-container-image').off().fadeOut().remove();
	});
})(jQuery, window.leopard);
