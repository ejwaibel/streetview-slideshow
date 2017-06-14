/**
 * The 'leopard' namespace
 * @type {Object}
 */
'use strict';

export const leopard = {
	api: {
		streetview: 'https://maps.googleapis.com/maps/api/streetview?size={{imageWidth}}x{{imageHeight}}&location={{location}}{{#heading}}&heading={{headingValue}}{{/heading}}{{#fov}}&fov={{fovValue}}{{/fov}}{{#pitch}}&pitch={{pitchValue}}{{/pitch}}&sensor=false'
	},
	buttons: {},
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
		containerSlider: '.js-container-slider',
		dialog: '#slideshow-dialog',
		imagesContainer: '.js-container-images',
		slider: '.js-slider',
		sliderValue: '.js-slider-value',
		streetviewImage: '.streetview-image'
	},
	geocoder: new google.maps.Geocoder(),
	invalidAddress: /(unnamed road)|(^[\w\d\s]+$)|(^\d+\-\d+)|(highway)|(freeway)|(development road)/i,
	images: {
		streetview: {
			width: 640,
			height: 640
		}
	},
	latitudeBoundary: {
		min: 28.70,
		max: 48.85
	},
	longitudeBoundary: {
		min: -127.50,
		max: -55.90
	},
	spinOptions: {
		lines: 15             // The number of lines to draw
		, length: 15             // The length of each line
		, width: 3              // The line thickness
		, radius: 10            // The radius of the inner circle
		, scale: 1.25            // Scales overall size of the spinner
		, corners: .5            // Roundness (0..1)
		, color: '#008cba'         // #rgb or #rrggbb
		, opacity: 1/4          // Opacity of the lines
		, rotate: 0             // Rotation offset
		, direction: 1          // 1: clockwise, -1: counterclockwise
		, speed: 1              // Rounds per second
		, trail: 70            // Afterglow percentage
		, fps: 20               // Frames per second when using setTimeout()
		, shadow: true         // Whether to render a shadow
	},
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
	},
	/**
	 * Code taken from MatthewCrumley (http://stackoverflow.com/a/934925/298479)
	 */
	getBase64Image: function(img) {
		// Create an empty canvas element
		var canvas = document.createElement('canvas'),
			ctx;

		canvas.width = img.width;
		canvas.height = img.height;

		// Copy the image contents to the canvas
		ctx = canvas.getContext('2d');
		ctx.drawImage(img, 0, 0);

		// Get the data-URL formatted image
		// Firefox supports PNG and JPEG. You could check img.src to guess the
		// original format, but be aware the using 'image/jpg' will re-encode the image.
		var dataURL = canvas.toDataURL('image/png');

		return dataURL.replace(/^data:image\/(png|jpg);base64,/, '');
	},
	/**
	 * Converts the given latitude/longitude values into a human
	 * @param  {Object} latlng [description]
	 * @return {Deferred} dfd    [description]
	 */
	getFormattedAddress: function(latlng) {
		var dfd = $.Deferred(),
			options = {
				location: latlng.latitude ? new google.maps.LatLng(latlng.latitude, latlng.longitude) : latlng
			},
			geocodeCallback = function(results, status) {
				var address = results && results.length && results[0] ? results[0].formatted_address : null;

				if (status === google.maps.GeocoderStatus.OK) {
					if (address.search(leopard.invalidAddress) !== -1 ||
						address.match(/\,/g).length < 3) {
						dfd.reject('RETRY');
					} else {
						dfd.resolve(address);
					}
				} else if (status === google.maps.GeocoderStatus.ZERO_RESULTS ||
						status === google.maps.GeocoderStatus.UNKNOWN_ERROR) {
					dfd.reject('RETRY');
				} else if (status === google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
					setTimeout(function() {
						leopard.geocoder.geocode(options, geocodeCallback);
					}, 1200);
				} else {
					dfd.reject(status);
				}
			};

		this.geocoder.geocode(options, geocodeCallback);

		return dfd.promise();
	},
	getRandom: function(from, to) {
		return Math.random() * (to - from) + from;
	},
	/**
	 * Return a random set of latitude/longitude values that are within
	 * the square bounds for North America
	 * @return {Object}
	 */
	getRandomLatLong: function() {
		var fixed = 5;

		return {
			// .toFixed() returns string, so ' * 1' is a trick to convert to number
			latitude: (this.getRandom(this.latitudeBoundary.min, this.latitudeBoundary.max)).toFixed(fixed) * 1,
			longitude: (this.getRandom(this.longitudeBoundary.min, this.longitudeBoundary.max)).toFixed(fixed) * 1
		};
	}
};
