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
		sliderUpdate = function( event, ui ) {
			$(event.target).parents(elements.containerSlider).find(elements.sliderValue).text( ui.value );
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
			$(event.target).parents(elements.containerSlider).find(elements.sliderValue).text( 0 );
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
				var geocoder = new google.maps.Geocoder(),
					options = {
						location: new google.maps.LatLng(location.latitude, location.longitude),
					};

				geocoder.geocode(options, function(results, status) {
					if (status === 'OK') {
						return addressDfd.resolve(results);
					} else if (status === 'ZERO_RESULTS' || status === 'UNKNOWN_ERROR') {
						latlong = leopard.getRandomLatLong();
						return getAddress(latlong);
					}

					addressDfd.reject(status);
				});

				return true;
			};

		if ($target.hasClass('disabled')) {
			return false;
		}

		$target.spin('small', 100);
		$target.addClass('disabled');

		getAddress(latlong);

		// Wait for valid address to be returned
		addressDfd.done(function(data) {
			$target.spin(false);
			$target.removeClass('disabled');
			input.val(data[0].formatted_address); /* jshint ignore: line */
		}).fail(function(data) {
			$target.spin(false);
			input.val(data);
		});
	});

	/**
	 * Form submit functionality
	 */
	$('form').on('submit', function(e) {
		var location, url, imgContainer, $img;

		// TODO: Validate longitude/latitude values
		location = $('#address-start').val();

		url = streetviewTpl.apply({
			key: leopard.api.key,
			location: location,
			heading: getSliderValue('heading'),
			fov: getSliderValue('fov'),
			pitch: getSliderValue('pitch')
		});

		e.preventDefault();
		imgContainer = $(imageTpl.apply());

		$(elements.imagesContainer).append(imgContainer);
		imgContainer.spin('small', 250);

		$img = $('<img>', {
			src: url,
			height: leopard.images.height,
			width: leopard.images.width
		});

		$img.load(function() {
			imgContainer.spin(false).append($img);
		});
	});

	$(elements.imagesContainer).delegate('.js-remove-image', 'click', function() {
		$(this).parents('.js-container-image').off().fadeOut().remove();
	});
});
