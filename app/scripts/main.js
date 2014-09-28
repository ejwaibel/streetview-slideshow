'use strict';

$(function() {
	var $imagesContainer = $('.js-images-container');

	$(document).foundation();

	$('form').on('submit', function(e) {
		var heading = $('#api-heading').val(),
			fov = $('#api-fov').val(),
			pitch = $('#api-pitch').val(),
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
