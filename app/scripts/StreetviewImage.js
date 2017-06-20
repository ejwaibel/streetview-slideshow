import _ from 'lodash';
import { config } from './config';
import { utils } from './utils';

import { Template } from './Template';

export class StreetviewImage {
	constructor(opts) {
		this.options = _.extend({
			elements: {
				menu: '.js-image-menu',
				removeImage: '.js-remove-image',
				streetviewImage: '.streetview-image'
			},
			height: 640,
			width: 640
		}, opts);

		this.$imgContainer = $(StreetviewImage.tpl.apply()),
		this.$streetviewImage = this.$imgContainer
								.find(this.options.elements.streetviewImage);
		this.$imageMenu = this.$imgContainer.find(this.options.elements.menu);
		this.$imageMenu
			.on('click', this.onToggleMenuClick)
			.on('click', this.options.elements.removeImage, this.onRemoveImageClick)
		;
	}

	static get tpl() {
		return new Template($('#streetview-image-tpl').html());
	}

	static get noImageData() {
		return new RegExp('ah4JdLMxVcEySefa6wxEgkBWYRpzNzuMEvoA$');
	}

	onRemoveImageClick() {
		$(this)
			.parents(config.elements.containerImage)
			.off()
			.fadeOut()
			.remove();
	}

	onToggleMenuClick() {
		$(this).addClass('open');
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
				.appendTo(this.$streetviewImage)
				.on('load', function() {
					let img64 = utils.getBase64Image(this).substr(0, 64);

					if (StreetviewImage.noImageData.test(img64)) {
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
				$img.attr('src', 'http://blog.sqlauthority.com/i/a/errorstop.png');
			})
			.always(() => {
				this.$imgContainer.spin(false);
			});
	}
}
