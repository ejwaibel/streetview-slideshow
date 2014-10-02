'use strict';

$(function() {
	var $sliders = {
			heading: $('#heading-slider'),
			fov: $('#fov-slider'),
			pitch: $('#pitch-slider')
		},
		getSliderValue = function(name) {
			return $sliders[name].slider('value');
		},
		sliderUpdate = function( event, ui ) {
			$(event.target).parents('.js-container-slider').find('.js-slider-value').text( ui.value );
		};

	/**
	 * Setup Foundation components and default values
	 */
	$(document).foundation();

	/**
	 * Setup jQuery UI Widgets
	 */
	$('.js-slider').slider({
		animate: true,
		min: 0,
		max: 180,
		range: "min",
		create: function(event, ui) {
			$(event.target).parents('.js-container-slider').find('.js-slider-value').text( 0 );
		},
		change: sliderUpdate,
		slide: sliderUpdate
	});
	$('#fov-slider').slider('option', {max: 120}).slider('value', 90);
	$('#pitch-slider').slider('option', {max: 90, min: -90}).slider('value', 0);

	/**
	 * [description]
	 * @param  {[type]} e [description]
	 * @return {[type]}   [description]
	 */
	$('.js-random-address').on('click', function(e) {
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
					if (data.status === 'OK') {
						return addressDfd.resolve(data);
					} else if (data.status === 'ZERO_RESULTS' || data.status === 'UNKNOWN_ERROR') {
						latlong = leopard.getRandomLatLong();
						return getAddress(latlong);
					}

					addressDfd.reject(data);
				});

				return true;
			};

		if ($target.hasClass('disabled')) {
			return false;
		}

		$target.spin('small');
		$target.addClass('disabled');

		getAddress(latlong);

		// Wait for valid address to be returned
		addressDfd.done(function(data) {
			$target.spin(false);
			$target.removeClass('disabled');
			input.val(data.results[0].formatted_address); /* jshint ignore: line */
		}).fail(function(data) {
			input.val(data.status);
		});
	});

	/**
	 * Form submit functionality
	 */
	$('form').on('submit', function(e) {
		var $imagesContainer = $('.js-images-container'),
			location, url;

		// TODO: Validate longitude/latitude values
		location = $('#address-start').val();

		url = new leopard.tpl(leopard.api.streetview).apply({
				key: leopard.api.key,
				width: leopard.images.width,
				height: leopard.images.height,
				location: location,
				heading: getSliderValue('heading'),
				fov: getSliderValue('fov'),
				pitch: getSliderValue('pitch')
		});

		$imagesContainer.append($('<img/>').attr('src', url)).fadeIn();

		e.preventDefault();
	});
});
