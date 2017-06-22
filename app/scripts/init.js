import { config } from './config';
import { utils } from './utils';
import { Slider } from './Slider';
import { StreetviewImage } from './StreetviewImage';
import { Template } from './Template';

export default function init() {
	let onGetDirectionsSubmit = function(e) {
			e.preventDefault();

			utils.toggleButtons(true);
			config.buttons.$getDirections.spin(config.spinOptions);
			config.buttons.$cancelDirections.disable(false);

			utils.generateDirectionsImages();

			return;
		},
		onGetImageClick = function(e) {
			var $target = $(e.currentTarget),
				$input = $($target.data('selector')),
				address = $input.val(),
				streetviewImage = new StreetviewImage(address, {
					pitch: config.sliders.pitch.value,
					rotation: config.sliders.heading.value,
					zoomLevel: config.sliders.fov.value
				});

			config.images.$container.append(streetviewImage.$el);
			streetviewImage.generateImage();
		},
		onGetCurrentLocationClick = function(e) {
			var $target = $(e.currentTarget),
				$input = $($target.data('selector'));

			$input.val('');

			$target
				.disable(true)
				.spin(config.spinOptions);

			navigator.geolocation.getCurrentPosition((pos) => {
				let latlng = {
						latitude: pos.coords.latitude,
						longitude: pos.coords.longitude
					},
					onFormattedAddressDone = function(data) {
						$target.spin(false);
						$input.val(data);
						config.buttons.$getImage
							.eq(0)
							.disable(false);
					};

				utils.getFormattedAddress(latlng)
					.always(onFormattedAddressDone);
			});
		};

	config.templates.retryMsg = new Template(config.mapsApi.retryMsg);
	config.templates.streetviewImage = new Template(config.mapsApi.imageUrl);
	config.templates.streetviewMetadata = new Template(config.mapsApi.metadataUrl);

	log.setLevel(config.log.level);

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
	$('form').on('submit', onGetDirectionsSubmit);

	// Get current location button
	config.buttons.$geolocation = $('.js-geolocation').disable(true);

	if (navigator.geolocation) {
		config.buttons.$geolocation.disable(false);
		config.buttons.$geolocation.on('click', onGetCurrentLocationClick);
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

	config.images.$container = $(config.elements.imagesContainer);

	/**
	 * Get image from address button
	 */
	config.buttons.$getImage = $('.js-get-image').disable(true);
	config.buttons.$getImage.on('click', onGetImageClick);

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

	config.buttons.$startSlideshow = $('.js-start-slideshow').disable(true);
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
	config.sliders.fov = new Slider({ title: 'FOV', uiSlider: { max: 120 } });
	config.sliders.fov.value = config.mapsApi.defaults.fov;
	config.sliders.pitch = new Slider({ title: 'PITCH', uiSlider: { max: 90, min: -90 } });
	config.sliders.pitch.value = config.mapsApi.defaults.pitch;

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
