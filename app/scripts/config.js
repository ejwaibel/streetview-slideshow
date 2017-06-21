'use strict';

export const config = {
	buttons: {}, // Initialize
	carouselOptions: {
		autoplay: 2000,
		freeMode: false,
		freeModeMomentum: false,
		nextButton: '.swiper-button-next',
		prevButton: '.swiper-button-prev',
		keyboardControl: true,
		loop: true,
		slidesPerGroup: 2,
		slidesPerView: 2
	},
	elements: {
		carousel: '.js-carousel',
		containerImage: '.js-container-image',
		containerSliders: '.js-container-sliders',
		dialogContent: '.js-slideshow-dialog .js-dialog-content',
		imagesContainer: '.js-container-images',
		stepProgress: '.js-step-progress'
	},
	images: {},
	// jscs:disable
	spinOptions: {
		lines: 15				// The number of lines to draw
		, length: 8			// The length of each line
		, width: 3				// The line thickness
		, radius: 10			// The radius of the inner circle
		, scale: 1.25			// Scales overall size of the spinner
		, corners: .5			// Roundness (0..1)
		, color: '#e5dfc5'		// #rgb or #rrggbb
		, opacity: 1 / 4		// Opacity of the lines
		, rotate: 0				// Rotation offset
		, direction: 1			// 1: clockwise, -1: counterclockwise
		, speed: 1				// Rounds per second
		, trail: 70				// Afterglow percentage
		, fps: 60				// Frames per second when using setTimeout()
		, shadow: true			// Whether to render a shadow
	},
	// jscs:enable
	sliders: {},
	streetview: {
		defaults: {
			heading: 0,
			fov: 120,
			pitch: 0
		},
		// jscs:disable
		invalidAddress: new RegExp(
			[
				'(^[\\w\\d\\s]+$)',
				'(^\\d+-\\d+)',
				'(^\\w+-\\d+,)',
				'(^\w+\sCounty)',
				'(Rd 1Bf)',
				'(unnamed road)',
				'(po box)',
				'(service|rte)',
				'(highway|hwy)',
				'(freeway)',
				'(development road)',
				'(Canada$)'
			].join('|'),
			'i'
		),
		// jscs:enable
		url: `
			https://maps.googleapis.com/maps/api/streetview
				?size={{imageWidth}}x{{imageHeight}}
				&location={{location}}
				&heading={{heading}}
				&fov={{fov}}
				&pitch={{pitch}}
				&sensor=false
		`
	},
	templates: {
		progressLabel: `
			<span class="js-steps-label progress-label"></span>
		`,
		slideshow: `
			<div class="swiper-container js-carousel">
				<div class="swiper-wrapper">
					{{#each slides}}
					<div class="swiper-slide">{{{this}}}</div>
					{{/each}}
				</div>
			</div>
			<div class="ui-control ui-control-prev swiper-button-prev" role="button"></div>
			<div class="ui-control ui-control-next swiper-button-next" role="button"></div>
		`
	}
};
