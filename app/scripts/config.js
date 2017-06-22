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
	log: {
		level: 'INFO'
	},
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
	mapsApi: {
		defaults: {
			heading: 0,
			fov: 120,
			pitch: 0
		},
		imageUrl: `
			https://maps.googleapis.com/maps/api/streetview?
				size={{imageWidth}}x{{imageHeight}}
				&location={{location}}
				&heading={{heading}}
				&fov={{fov}}
				&pitch={{pitch}}
		`,
		metadataUrl: `
			https://maps.googleapis.com/maps/api/streetview/metadata?
				location={{location}}
				&key=AIzaSyAej9k-fWbn3QBodX7BBMhnZCwKNAjyxm4
		`,
		retryMsg: 'RETRY - {{address}} - {{msg}} - {{status}}',
		statusCodes: {
			OK: google.maps.GeocoderStatus.OK,
			NOT_FOUND: 'NOT_FOUND',
			OVER_QUERY_LIMIT: google.maps.GeocoderStatus.OVER_QUERY_LIMIT,
			UNKNOWN_ERROR: google.maps.GeocoderStatus.UNKNOWN_ERROR,
			ZERO_RESULTS: google.maps.GeocoderStatus.ZERO_RESULTS
		}
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
