import _ from 'lodash';
import { config } from './config';
import { utils } from './utils';
import { Slider } from './Slider';
import { StreetviewImage } from './StreetviewImage';
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

	// Get current location button
	config.buttons.$geolocation = $('.js-geolocation').disable(true);

	if (navigator.geolocation) {
		config.buttons.$geolocation.disable(false);
		config.buttons.$geolocation.on('click', utils.onGetCurrentLocationClick);
	}

	// Get random address button
	config.buttons.$randomAddress = $('.js-random-address');
	config.buttons.$randomAddress.on('click', utils.randomAddressClickCallback);

	// Create the autocomplete object, restricting the search to geographical
	// location types.
	new google.maps.places.Autocomplete(
		$('#address-origin')[0],
		{ type: 'geocode' }
	).setComponentRestrictions(
		{ country: ['us'] }
	);
	new google.maps.places.Autocomplete(
		$('#address-destination')[0],
		{ type: 'geocode' }
	).setComponentRestrictions(
		{ country: ['us'] }
	);

	/**
	 * Get image from address button
	 */
	config.buttons.$getImage = $('form .js-get-image');
	config.buttons.$getImage.on('click', function(e) {
		var $target = $(e.currentTarget),
			$input = $($target.data('selector')),
			address = $input.val(),
			streetviewImage = new StreetviewImage();

		streetviewImage.generateImage(address);
	});

	config.images.$container = $(config.elements.imagesContainer);

	/**
	 * Clear all images
	 */
	config.buttons.$clearImages = $('.js-clear-images');
	config.buttons.$clearImages.on('click', function(e) {
		config.images.$container
			.find(config.elements.containerImage + ' .js-remove-image')
			.trigger('click');
	});

	// Get Directions button
	config.buttons.$getDirections = $('.js-get-directions');

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

	// Start slideshow button
	let slideshowTpl = new Template(config.templates.slideshow);

	config.buttons.$startSlideshow = $('.js-start-slideshow');
	config.buttons.$startSlideshow.on('click', function(e) {
		let $images = $('.streetview-image').clone(),
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
