import _ from 'lodash';
import { config } from './config';
import { utils } from './utils';

import { Slider } from './Slider';
import { Template } from './Template';

export class StreetviewImage {
	constructor(location, opts) {
		this.location = location;

		this.options = _.extend({
			elements: {
				menu: '.js-image-menu',
				action: '.js-image-action',
				streetviewImage: '.streetview-image'
			},
			height: 640,
			width: 640
		}, opts);

		this.$el = $(StreetviewImage.tpl.apply()),
		this.$streetviewImage = this.$el
								.find(this.options.elements.streetviewImage);
		this.$imageMenu = this.$el.find(this.options.elements.menu);
		this.$imageMenu
			.on('click', this.onToggleMenuClick)
			.on('click', this.options.elements.action, this.onMenuActionClick)
		;

		this.sliders = {
			heading: new Slider({
				setTitle: false
			}),
			pitch: new Slider({
				setTitle: false,
				uiSlider: {
					orientation: 'vertical',
					min: -90,
					max: 90
				}
			})
		};

		this.$streetviewImage
			.prepend(this.sliders.heading.$slider)
			.append(this.sliders.pitch.$slider);

		return this;
	}

	static get tpl() {
		return new Template($('#streetview-image-tpl').html());
	}

	static get noImageData() {
		return new RegExp('ah4JdLMxVcEySefa6wxEgkBWYRpzNzuMEvoA$');
	}

	onMenuActionClick(e) {
		$(this)
			.parents(config.elements.containerImage)
			.off()
			.fadeOut()
			.remove();
	}

	onToggleMenuClick() {
		$(this).addClass('open');
	}

	generateImage() {
		var imgHeight = this.options.height,
			imgWidth = this.options.width,
			imgUrl, $img, i;

		this.$el
			.spin(config.spinOptions)
			.find('.js-location-title')
				.text(this.location);

		imgUrl = config.templates.streetview.apply({
			location: this.location,
			imageHeight: imgHeight,
			imageWidth: imgWidth,
			heading: config.sliders.heading.value,
			fov: config.sliders.fov.value,
			pitch: config.sliders.pitch.value
		});

		let imgAttr = {
			crossOrigin: 'anonymous'
		};

		// Setup new <img> element with default attributes and
		// append it to image container
		$img = $('<img>', imgAttr)
				.appendTo(this.$streetviewImage)
				.on('load', function() {
					let img64 = utils.getBase64Image(this).substr(0, 64);

					if (StreetviewImage.noImageData.test(img64)) {
						$(this).attr(
							'src',
							`http://unsplash.it/g/${imgWidth}/${imgHeight}?blur&random`
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
				$img.attr('src', 'images/errorstop.png');
			})
			.always(() => {
				this.$el.spin(false);
			});
	}
}
