import { config } from './config';
import { utils } from './utils';
import { Slider } from './Slider';
import { Template } from './Template';

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
	 * Form submit functionality
	 */
	$('form').on('submit', utils.getDirectionsCallback);

	/**
	 * Remove image icon
	 */
	$(config.elements.imagesContainer).on('click', '.js-remove-image', function() {
		$(this).parents('.js-container-image').off().fadeOut().remove();
	});

	/**
	 * Setup jQuery UI Buttons
	 */

	// Cancel Directions button
	config.buttons.$cancelDirections = $('.js-cancel-directions').disable(true);
	config.buttons.$cancelDirections.on('click', function() {
		var $this = $(this),
			i;

		// Stop all running directions setTimeout calls
		for (i = 0; i < utils.directionTimers.length; i++) {
			clearTimeout(utils.directionTimers[i]);
		}

		config.buttons.$getDirections.spin(false);
		utils.toggleButtons(false);

		utils.directionTimers = [];

		$this.disable(true);
	});

	// Get Directions button
	config.buttons.$getDirections = $('.js-get-directions');

	// Get random address button
	config.buttons.$randomAddress = $('.js-random-address');
	config.buttons.$randomAddress.on('click', utils.randomAddressClickCallback);

	// Start slideshow button
	config.buttons.$startSlideshow = $('.js-start-slideshow');

	/**
	 * Get image from address button
	 */
	config.buttons.$getImage = $('form .js-get-image');
	config.buttons.$getImage.on('click', function(e) {
		var $element = $(e.target),
			$target = $element.attr('data-selector') ? $element : $element.parent(),
			$input = $($target.data('selector')),
			address = $input.val();

		utils.generateImage(address);
	});

	/**
	 * Setup jQuery UI Sliders
	 */
	config.sliders.heading = new Slider($('#heading-slider'));
	config.sliders.fov = new Slider($('#fov-slider'));
	config.sliders.pitch = new Slider($('#pitch-slider'));

	config.sliders.fov
		.setOption({ max: 120 })
		.setValue(90);

	config.sliders.pitch
		.setOption({ max: 90, min: -90 })
		.setValue(0);
};
