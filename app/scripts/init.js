import { config } from './config.js';
import { Template } from './template.js';

export default function init() {
	var sliderUpdate = function(event, ui) {
			$(event.target)
				.parents(config.elements.containerSlider)
				.find(config.elements.sliderValue)
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
		let swiper = new Swiper(config.elements.carousel, config.carouselOptions);
	});

	/**
	 * Setup jQuery UI Buttons
	 */
	config.buttons.$cancelDirections = $('form .js-cancel-directions').disable(true),
	config.buttons.$getDirections = $('form .js-get-directions'),
	config.buttons.$getImage = $('form .js-get-image'),
	config.buttons.$randomAddress = $('form .js-random-address'),
	config.buttons.$startSlideshow = $('.js-start-slideshow'),

	/**
	 * Setup jQuery UI Sliders
	 */
	$(config.elements.slider).slider({
		animate: true,
		min: 0,
		max: 180,
		range: 'min',
		create: function(event) {
			$(event.target)
				.parents(config.elements.containerSlider)
				.find(config.elements.sliderValue)
				.text(0);
		},
		change: sliderUpdate,
		slide: sliderUpdate
	});
	$('#fov-slider').slider('option', { max: 120 }).slider('value', 90);
	$('#pitch-slider').slider('option', { max: 90, min: -90 }).slider('value', 0);
};
