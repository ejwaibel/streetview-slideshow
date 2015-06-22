(function($, leopard) {
	var sliderUpdate = function(event, ui) {
			$(event.target)
				.parents(leopard.elements.containerSlider)
				.find(leopard.elements.sliderValue)
				.text(ui.value);
		};

	/**
	 * Setup Foundation components and default values
	 */
	$(document).foundation();

	/**
	 * Setup jQuery UI Buttons
	 */
	leopard.buttons.$cancelDirections = $('form .js-cancel-directions').button({ disabled: true }),
	leopard.buttons.$getDirections = $('form .js-get-directions').button(),
	leopard.buttons.$getImage = $('form .js-get-image').button(),
	leopard.buttons.$randomAddress = $('form .js-random-address').button(),

	/**
	 * Setup jQuery UI Sliders
	 */
	$(leopard.elements.slider).slider({
		animate: true,
		min: 0,
		max: 180,
		range: 'min',
		create: function(event) {
			$(event.target)
				.parents(leopard.elements.containerSlider)
				.find(leopard.elements.sliderValue)
				.text(0);
		},
		change: sliderUpdate,
		slide: sliderUpdate
	});
	$('#fov-slider').slider('option', { max: 120 }).slider('value', 90);
	$('#pitch-slider').slider('option', { max: 90, min: -90 }).slider('value', 0);
})(jQuery, window.leopard);
