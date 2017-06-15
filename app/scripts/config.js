'use strict';

export const config = {
	api: {
		images: {
			width: 960,
			height: 960
		},
		streetview: `
			https://maps.googleapis.com/maps/api/streetview
				?size={{imageWidth}}x{{imageHeight}}
				&location={{location}}
				{{#heading}}&heading={{headingValue}}{{/heading}}
				{{#fov}}&fov={{fovValue}}{{/fov}}
				{{#pitch}}&pitch={{pitchValue}}{{/pitch}}
				&sensor=false
		`
	},
	buttons: {}, // Initialize
	carouselOptions: {
		autoplay: 2000,
		effect: 'coverflow',
		freeMode: false,
		freeModeMomentum: false,
		nextButton: '.swiper-button-next',
		prevButton: '.swiper-button-prev',
		keyboardControl: true,
		loop: true
	},
	elements: {
		carousel: '.js-carousel',
		dialogContent: '.js-slideshow-dialog .js-dialog-content',
		imagesContainer: '.js-container-images'
	},
	images: {},
	// jscs:disable
	spinOptions: {
		lines: 15				// The number of lines to draw
		, length: 12			// The length of each line
		, width: 3				// The line thickness
		, radius: 10			// The radius of the inner circle
		, scale: 1.25			// Scales overall size of the spinner
		, corners: .5			// Roundness (0..1)
		, color: '#008cba'		// #rgb or #rrggbb
		, opacity: 1 / 4		// Opacity of the lines
		, rotate: 0				// Rotation offset
		, direction: 1			// 1: clockwise, -1: counterclockwise
		, speed: 1				// Rounds per second
		, trail: 70				// Afterglow percentage
		, fps: 20				// Frames per second when using setTimeout()
		, shadow: true			// Whether to render a shadow
	},
	// jscs:enable
	sliders: {},
	templates: {
		img: `
			<li class="container-streetview-image js-container-image">
				<i class="icon icon-remove fa fa-remove clickable js-remove-image"></i>
			</li>
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