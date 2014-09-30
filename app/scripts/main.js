'use strict';

$(function() {
	var $imagesContainer = $('.js-images-container'),
		$sliders = {
			heading: $('.js-heading-slider'),
			fov: $('.js-fov-slider'),
			pitch: $('.js-pitch-slider')
		};

	/**
	 * Setup Foundation components and default values
	 */
	$(document).foundation();
	$sliders.heading.foundation('slider', 'set_value', 0);
	$sliders.fov.foundation('slider', 'set_value', 90);
	$sliders.pitch.foundation('slider', 'set_value', 0);

	$('.js-random-address').click(function(e) {
		var $target = $(e.target),
			input = $($target.data('selector')),
			latlong = leopard.getRandomLatLong(),
			addressDfd = $.Deferred(),
			/**
			 * Converts the given latitude/longitude values into a human
			 * readable address. Continues to loop if the values given
			 * do not return a valid address.
			 * @param  {Object} location
			 */
			getAddress = function(location) {
				$.ajax({
					url: new leopard.tpl(leopard.api.geocode).apply({
						location: location.latitude + ',' + location.longitude,
						key: leopard.api.key
					})
				}).done(function(data) {
					if (data.status == 'OK') {
						return addressDfd.resolve(data);
					} else if (data.status == 'ZERO_RESULTS' || data.status == 'UNKNOWN_ERROR') {
						latlong = leopard.getRandomLatLong();
						return getAddress(latlong);
					}

					addressDfd.reject(data);
				});

				return true;
			};

		getAddress(latlong);

		// Wait for valid address to be returned
		addressDfd.done(function(data) {
			input.val(data.results[0].formatted_address);
		}).fail(function(data) {
			input.val(data.status);
		});
	});

	/**
	 * Form submit functionality
	 */
	$('form').on('submit', function(e) {
		var heading = $sliders.heading.attr('data-slider'),
			fov = $sliders.fov.attr('data-slider'),
			pitch = $sliders.pitch.attr('data-slider'),
			location, url;

		// TODO: Validate longitude/latitude values
		location = $('#address-start').val();

		url = new leopard.tpl(leopard.api.streetview).apply({
				key: leopard.api.key,
				width: leopard.images.width,
				height: leopard.images.height,
				location: location,
				heading: heading,
				fov: fov,
				pitch: pitch
		});

		$imagesContainer.append($('<img/>').attr('src', url)).fadeIn();

		e.preventDefault();
	});
});
