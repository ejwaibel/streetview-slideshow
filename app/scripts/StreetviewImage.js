import _ from 'lodash';
import { config } from './config';
import { utils } from './utils';

export class StreetviewImage {
	constructor(opts) {
		this.options = _.extend({
			elements: {
				streetviewImage: '.streetview-image'
			},
			height: 640,
			width: 640
		}, opts);

		this.$imgContainer = $(StreetviewImage.imgTpl()),
		this.$streetviewImage = this.$imgContainer
								.find(this.options.elements.streetviewImage);

		/**
		 * Remove image icon
		 */
		config.images.$container = $(config.elements.imagesContainer);
		config.images.$container.on('click', '.js-remove-image', utils.onRemoveImageClick);

		/**
		 * Clear all images
		 */
		config.buttons.$clearImages = $('.js-clear-images');
		config.buttons.$clearImages.on('click', function(e) {
			config.images.$container
				.find(config.elements.containerImage + ' .js-remove-image')
				.trigger('click');
		});
	}

	static imgTpl() {
		return `
			<li class="container-streetview-image js-container-image">
				<i class="icon icon-remove fa fa-remove clickable js-remove-image"></i>
				<div class="streetview-image">
					<p class="location-title js-location-title"></p>
				</div>
			</li>
		`;
	}

	static noImageData() {
		return new RegExp('ah4JdLMxVcEySefa6wxEgkBWYRpzNzuMEvoA$');
	}

	onRemoveImageClick() {
		$(this)
			.parents(config.elements.containerImage)
			.off()
			.fadeOut()
			.remove();
	}

	generateImage(location) {
		var imgHeight = this.options.height,
			imgWidth = this.options.width,
			imgUrl, $img, i;

		config.images.$container.append(this.$imgContainer);
		this.$imgContainer
			.spin(config.spinOptions)
			.find('.js-location-title')
				.text(location);

		imgUrl = config.templates.streetview.apply({
			location: location,
			imageHeight: imgHeight,
			imageWidth: imgWidth,
			heading: config.sliders.heading.value,
			fov: config.sliders.fov.value,
			pitch: config.sliders.pitch.value
		});

		let imgAttr = {
			crossOrigin: 'anonymous',
			title: location
		};

		// Setup new <img> element with default attributes and
		// append it to image container
		$img = $('<img>', imgAttr)
				.prependTo(this.$streetviewImage)
				.on('load', function() {
					let img64 = utils.getBase64Image(this).substr(0, 64);

					if (StreetviewImage.noImageData().test(img64)) {
						// utils.onRemoveImageClick.call(this);
						$(this).attr(
							'src',
							`https://unsplash.it/g/${imgWidth}/${imgHeight}?blur&random`
						);
					}
				});

		// Get the URL to the image and once that finishes, set the same URL on the
		// image and stop the spinner on image container
		$.get(imgUrl)
			.done(() => {
				$img.attr('src', imgUrl);
			})
			.fail(() => {
				$img.attr('src', 'https://blog.sqlauthority.com/i/a/errorstop.png');
			})
			.always(() => {
				this.$imgContainer.spin(false);
			});
	}
}
