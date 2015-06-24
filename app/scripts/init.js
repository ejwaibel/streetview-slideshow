(function($, leopard) {
	var sliderUpdate = function(event, ui) {
			$(event.target)
				.parents(leopard.elements.containerSlider)
				.find(leopard.elements.sliderValue)
				.text(ui.value);
		};

	// Extended disable function
	jQuery.fn.extend({
		disable: function(state) {
			return this.each(function() {
				var $this = $(this);

				if ($this.is('input, button')) {
					this.disabled = state;
				} else {
					$this.toggleClass('disabled', state);
				}
			});
		}
	});

	/**
	 * Setup Foundation components and default values
	 */
	$(document).foundation();

	/**
	 * Setup jQuery UI Buttons
	 */
	leopard.buttons.$cancelDirections = $('form .js-cancel-directions').disable(true),
	leopard.buttons.$getDirections = $('form .js-get-directions'),
	leopard.buttons.$getImage = $('form .js-get-image'),
	leopard.buttons.$randomAddress = $('form .js-random-address'),
	leopard.buttons.$startSlideshow = $('.js-start-slideshow'),

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
