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
		generateImages = function(locations) {
			var imgUrl, $img, $imgContainer, i;

			for (i = 0; i < locations.length; i++) {
				$imgContainer = $(imageTpl.apply());
				$(elements.imagesContainer).append($imgContainer);
				$imgContainer.spin('small', 250);

				imgUrl = streetviewTpl.apply({
					key: leopard.api.key,
					location: locations[i],
					heading: true,
					headingValue: getSliderValue('$heading'),
					fov: true,
					fovValue: getSliderValue('$fov'),
					pitch: true,
					pitchValue: getSliderValue('$pitch')
				});

				$img = $('<img>', {
					src: imgUrl,
					height: leopard.images.height,
					width: leopard.images.width
				});

				$img.load(displayImage.call(this, $imgContainer, $img));
			}

			$directionsBtn.removeClass('disabled').spin(false);
		},
		getDirectionsCallback = function(e) {
			var getLocations = function() {
					var origin = $('#address-origin').val(),
						destination = $('#address-destination').val(),
						locationDfd = $.Deferred(),
						directionsService = new google.maps.DirectionsService(),
						directionsRequest;

					if (destination) {
						directionsRequest = {
							origin: origin,
							destination: destination,
							travelMode: google.maps.TravelMode.DRIVING
						};

						directionsService.route(directionsRequest, function(result, status) {
							var steps,
								locationsDfd = [],
								i = 0,
								timer,
								geocodeStep = function(step, dfdArray) {
									dfdArray.push(leopard.getFormattedAddress(step.start_location));
								};

							if (status === google.maps.DirectionsStatus.OK) {
								steps = result.routes[0].legs[0].steps;

								for (i = 0; i < steps.length; i++) {
									// Ensure we don't exceed the 5 queries per second limit
									setTimeout(geocodeStep.call(this, steps[i], locationsDfd), (i + 1) * 1500);
								}

								timer = setInterval(function() {
									if (locationsDfd.length === steps.length) {
										clearInterval(timer);

										$.when.apply($, locationsDfd).then(function() {
											locationDfd.resolve(arguments);
										});
									}
								}, 3000);
							} else {
								locationDfd.reject(status);
							}
						});
					} else {
						// TODO: Throw error 'destination is required'
					}

					return locationDfd;
				},
				getLocationsFailback = function(status) {
					$directionsBtn.spin(false);
					window.alert(status);
				};

			// TODO: Validate longitude/latitude values

			e.preventDefault();

			if ($directionsBtn.hasClass('disabled')) {
				return false;
			}

			$directionsBtn.addClass('disabled').spin('medium', 100);

			getLocations()
				.done(generateImages)
				.fail(getLocationsFailback);
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

		generateImages([address]);
	});

	/**
	 * Form submit functionality
	 */
	$('form').on('submit', getDirectionsCallback);

	$(elements.imagesContainer).delegate('.js-remove-image', 'click', function() {
		$(this).parents('.js-container-image').off().fadeOut().remove();
	});
});
