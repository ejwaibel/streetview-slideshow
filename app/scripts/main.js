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
		$sliders = {
			heading: $('#heading-slider'),
			fov: $('#fov-slider'),
			pitch: $('#pitch-slider')
		},
		getSliderValue = function(name) {
			return $sliders[name].slider('value');
		},
		sliderUpdate = function(event, ui) {
			$(event.target)
				.parents(elements.containerSlider)
				.find(elements.sliderValue)
				.text(ui.value);
		},
		getFormattedAddress = function(latlng) {
			var geocoder = new google.maps.Geocoder(),
				dfd = $.Deferred(),
				options = {
					location: latlng.latitude ? new google.maps.LatLng(latlng.latitude, latlng.longitude) : latlng
				},
				invalidAddress = /unnamed road/i;

			console.debug('options:', options);

			geocoder.geocode(options, function(results, status) {
				var address;

				console.debug('results', results);
				console.debug('status', status);

				if (status === 'OK') {
					address = results[0].formatted_address;

					if (address.search(invalidAddress) !== -1 ||
						address.match(/\,/g).length < 3) {
						dfd.reject('RETRY');
					} else {
						dfd.resolve(address);
					}
				} else if (status === 'ZERO_RESULTS' ||
						status === 'UNKNOWN_ERROR') {
					dfd.reject('RETRY');
				} else {
					dfd.reject(status);
				}
			});

			return dfd;
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
	$('.js-random-address').on('click', function(e) {
		var $target = $(e.target),
			$input = $($target.data('selector')),
			latlong = leopard.getRandomLatLong(),
			addressDfd = $.Deferred(),
			/**
			 * Converts the given latitude/longitude values into a human
			 * readable address. Continues to loop if the values given
			 * do not return a valid address.
			 * @param  {Object} location
			 */
			getRandomAddress = function(latlng) {
				getFormattedAddress(latlng)
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

				return true;
			};

		if ($target.hasClass('disabled')) {
			return false;
		}

		$target.addClass('disabled').spin('small', 100);

		// Wait for valid address to be returned
		getRandomAddress(latlong);

		addressDfd
			.done(function(data) {
				$target.spin(false);
				$target.removeClass('disabled');
				$input.val(data); /* jshint ignore: line */
			}).fail(function(data) {
				$target.spin(false);
				$input.val('ERROR: ' + data);
			});
	});

	/**
	 * Form submit functionality
	 */
	$('form').on('submit', function(e) {
		var $submitBtn = $(this).find('button[data-submit]'),
			imgUrl, $img, $imgContainer,
			getLocations = function() {
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
							formatAddress = function(step) {
								console.debug('step', step);
								locationsDfd.push(getFormattedAddress(step.start_location));
							};

						console.debug('result', result);

						if (status === google.maps.DirectionsStatus.OK) {
							steps = result.routes[0].legs[0].steps;

							for (var i = 0; i < steps.length; i++) {
								setTimeout(formatAddress.call(this, steps[i]), 2500);
							}

							$.when.apply($, locationsDfd).then(function(data) {
								console.debug('data', data);
								locationDfd.resolve(data);
							});
						} else {
							locationDfd.reject(status);
						}
					});
				} else {
					locationDfd.resolve([origin]);
				}

				return locationDfd;
			},
			displayImage = function($container, $image) {
				$container.spin(false).append($image);
			};

		// TODO: Validate longitude/latitude values

		e.preventDefault();

		if ($submitBtn.hasClass('disabled')) {
			return false;
		}

		$submitBtn.addClass('disabled').spin('medium', 100);

		getLocations().done(function(locations) {
			for (var i = 0; i < locations.length; i++) {
				$imgContainer = $(imageTpl.apply());
				$(elements.imagesContainer).append($imgContainer);
				$imgContainer.spin('small', 250);

				imgUrl = streetviewTpl.apply({
					key: leopard.api.key,
					location: locations[i],
					heading: getSliderValue('heading'),
					fov: getSliderValue('fov'),
					pitch: getSliderValue('pitch')
				});

				$img = $('<img>', {
					src: imgUrl,
					height: leopard.images.height,
					width: leopard.images.width
				});

				$img.load(displayImage.call(this, $img));
			}
			$submitBtn.removeClass('disabled').spin(false);
		}).fail(function(status) {
			$submitBtn.spin(false);
			window.alert(status);
		});
	});

	$(elements.imagesContainer).delegate('.js-remove-image', 'click', function() {
		$(this).parents('.js-container-image').off().fadeOut().remove();
	});
});
