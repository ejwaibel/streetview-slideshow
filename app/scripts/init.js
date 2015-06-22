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
	 * Setup global jQuery UI components
	 */
	$('button').button();

	/**
	 * Setup jQuery UI Widgets
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
