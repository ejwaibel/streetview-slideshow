import { leopard } from './leopard.js';
import { Template } from './template.js';

export default function init() {
	var sliderUpdate = function(event, ui) {
			$(event.target)
				.parents(leopard.elements.sliderContainer)
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
				}

				$this.toggleClass('disabled', state);
			});
		}
	});

	/**
	 * Setup Foundation components and default values
	 */
	$(document).foundation();
	$(document).on('opened.fndtn.reveal', function() {
		let swiper = new Swiper(leopard.elements.carousel, leopard.carouselOptions);
	});

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
				.parents(leopard.elements.sliderContainer)
				.find(leopard.elements.sliderValue)
				.text(0);
		},
		change: sliderUpdate,
		slide: sliderUpdate
	});
	$('#fov-slider').slider('option', { max: 120 }).slider('value', 90);
	$('#pitch-slider').slider('option', { max: 90, min: -90 }).slider('value', 0);
};
