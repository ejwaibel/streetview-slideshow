import { config } from './config';
import { utils } from './utils';
import { Slider } from './Slider';
import { Template } from './Template';

export default function init() {
	config.templates.streetview = new Template(config.api.streetview);

	/**
	 * Setup Foundation components and default values
	 */
	$(document)
		.foundation()
		.on('opened.fndtn.reveal', function() {
			let swiper = new Swiper(config.elements.carousel, config.carouselOptions);
		});

	config.$dialogContent = $(config.elements.dialogContent);

	/**
	 * Form submit functionality
	 */
	$('form').on('submit', utils.getDirectionsCallback);

	/**
	 * Remove image icon
	 */
	config.images.$container = $(config.elements.imagesContainer);
	config.images.$container.on('click', '.js-remove-image', function() {
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
	let slideshowTpl = new Template(config.templates.slideshow);

	config.buttons.$startSlideshow = $('.js-start-slideshow');
	config.buttons.$startSlideshow.on('click', function(e) {
		var $images = $(config.elements.streetviewImage).clone(),
			slides = $images.map(function(index, el) {
				return el.outerHTML;
			}).toArray(),
			$scroller = $(slideshowTpl.apply({ slides: slides }));

		e.preventDefault();

		config.$dialogContent
			.empty()
			.append($scroller);
	});

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
