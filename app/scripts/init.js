import _ from 'lodash';
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
	config.images.$container.on('click', '.js-remove-image', utils.onRemoveImageClick);

	/**
	 * Setup jQuery UI Buttons
	 */

	// Cancel Directions button
	config.buttons.$cancelDirections = $('.js-cancel-directions').disable(true);
	config.buttons.$cancelDirections.on('click', function() {
		var $this = $(this);

		// Stop all running directions setTimeout calls
		_.forEach(utils.directionTimers, function(val) {
			clearTimeout(val);
		});

		utils.directionTimers = [];

		config.buttons.$getDirections.spin(false);
		utils.toggleButtons(false);

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
	 * Clear all images
	 */
	config.buttons.$clearImages = $('.js-clear-images');
	config.buttons.$clearImages.on('click', function(e) {
		config.images.$container
			.find(config.elements.containerImage + ' .js-remove-image')
			.trigger('click');
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
	config.sliders.heading = new Slider({ title: 'HEADING' });
	config.sliders.fov = new Slider({ title: 'FOV' }, { max: 120 });
	config.sliders.fov.value = config.api.defaults.fov;
	config.sliders.pitch = new Slider({ title: 'PITCH' }, { max: 90, min: -90 });
	config.sliders.pitch.value = config.api.defaults.pitch;

	// Append each slider to the DOM
	_.forEach(config.sliders, function(slider) {
		$(config.elements.containerSliders).append(slider.$el);
	});

	/**
	 * Setup jQuery UI Progress Bar
	 */
	config.$stepsProgress = $(config.elements.stepProgress).progressbar({ disabled: true });
	config.$stepsProgress.append(config.templates.progressLabel);
};
