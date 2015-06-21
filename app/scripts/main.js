'use strict';

$(function() {
	var imageTpl = new leopard.tpl($('#tpl-image-container').html()),
		streetviewTpl = new leopard.tpl(leopard.api.streetview),
		elements = {
			containerSlider: '.js-container-slider',
			imagesContainer: '.js-container-images',
			imageContainer: '.js-container-image',
			slider: '.js-slider',
			sliderValue: '.js-slider-value'
		},
		sliders = {
			$heading: $('#heading-slider'),
			$fov: $('#fov-slider'),
			$pitch: $('#pitch-slider')
		},
		$directionsBtn = $('form .js-get-directions'),
		$getImageBtn = $('form .js-get-image'),
		$randomAddressBtn = $('form .js-random-address'),
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
					var steps, i;

					if (status === google.maps.DirectionsStatus.OK) {
						steps = result.routes[0].legs[0].steps;

						generateImage(origin);
						finishedSteps++;

						// Only steps in between origin & destination
						for (i = 1; i < steps.length - 1; i++) {
							// Ensure we don't exceed the 5 queries per second limit
							setTimeout(function(step) {
								geocodeDirection(step)
									.always(geocodeCallback);
								// TODO: Add failback for image from directions
							}, (i + 1) * 1500, steps[i]);
						}

						timer = setInterval(function() {
							if (finishedSteps === steps.length - 1) {
								clearInterval(timer);
								generateImage(destination);
								$directionsBtn.removeClass('disabled').spin(false);
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

			$(elements.imagesContainer).append($imgContainer);
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

			generateDirectionsImages();

			return;
		},
		getSliderValue = function(name) {
			return parseInt(sliders[name].slider('value'), 10);
		},
		sliderUpdate = function(event, ui) {
			$(event.target)
				.parents(elements.containerSlider)
				.find(elements.sliderValue)
				.text(ui.value);
		};

	/**
	 * Setup Foundation components and default values
	 */
	$(document).foundation();

	/**
	 * Setup jQuery UI Widgets
	 */
	$(elements.slider).slider({
		animate: true,
		min: 0,
		max: 180,
		range: 'min',
		create: function(event) {
			$(event.target).parents(elements.containerSlider).find(elements.sliderValue).text(0);
		},
		change: sliderUpdate,
		slide: sliderUpdate
	});
	$('#fov-slider').slider('option', { max: 120 }).slider('value', 90);
	$('#pitch-slider').slider('option', { max: 90, min: -90 }).slider('value', 0);

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

	$(elements.imagesContainer).on('click', '.js-remove-image', function() {
		$(this).parents('.js-container-image').off().fadeOut().remove();
	});
});
