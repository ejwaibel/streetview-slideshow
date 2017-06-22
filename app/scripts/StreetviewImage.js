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
				streetviewImage: '.streetview-image',
				title: '.js-location-title'
			},
			height: 640,
			width: 640,
			zoomLevel: 120,
			rotation: 0,
			pitch: 0
		}, opts);

		this.pitch = this.options.pitch;
		this.rotation = this.options.rotation;
		this.zoomLevel = this.options.zoomLevel;

		this.$el = $(StreetviewImage.tpl.apply()),
		this.$streetviewImage = this.$el
								.find(this.options.elements.streetviewImage);
		this.$imageMenu = this.$el.find(this.options.elements.menu);
		this.$imageMenu
			.on('click', this.onToggleMenuClick)
			.on('click', this.options.elements.action, this.onMenuActionClick.bind(this))
		;

		this.sliders = {
			heading: new Slider({
				setTitle: false,
				uiSlider: {
					stop: (event, ui) => {
						this.rotation = ui.value;
						this.onUpdateCamera();
					}
				}
			}),
			pitch: new Slider({
				setTitle: false,
				uiSlider: {
					orientation: 'vertical',
					min: -90,
					max: 90,
					stop: (event, ui) => {
						this.pitch = ui.value;
						this.onUpdateCamera();
					}
				}
			})
		};

		this.$streetviewImage
			.prepend(this.sliders.heading.$slider)
			.append(this.sliders.pitch.$slider);

		this.$el
			.find(this.options.elements.title)
				.text(this.location);

		return this;
	}

	static get tpl() {
		return new Template($('#streetview-image-tpl').html());
	}

	static get noImageData() {
		return new RegExp('5xlzFAAAI4ElEQVR4Xu3UAQkAIBRDQe1fUgRzKNjiwZnA3T6bZ');
	}

	onMenuActionClick(e) {
		let $target = $(e.currentTarget),
			action = $target.data('action');

		switch (action) {
			case 'remove':
				$target
					.parents(config.elements.containerImage)
					.off()
					.fadeOut()
					.remove();

				break;

			case 'zoomLevel':
				this.zoomLevel -= 25;
				this.onUpdateCamera();
				break;
		}
	}

	onToggleMenuClick() {
		$(this).toggleClass('open');
	}

	onUpdateCamera() {
		this.isUpdating = true;

		this.generateImage();
	}

	generateImage() {
		var imgHeight = this.options.height,
			imgWidth = this.options.width,
			imgUrl, $img, i;

		imgUrl = config.templates.streetviewImage.apply({
			location: this.location,
			imageHeight: imgHeight,
			imageWidth: imgWidth,
			heading: this.rotation || config.mapsApi.defaults.heading,
			fov: this.zoomLevel || config.mapsApi.defaults.fov,
			pitch: this.pitch || config.mapsApi.defaults.pitch
		});

		let imgAttr = {
			crossOrigin: 'anonymous'
		};

		if (this.isUpdating) {
			this.$streetviewImage
				.height(this.$streetviewImage.find('img').eq(0).height());

			this.$streetviewImage
				.addClass('replace-image')
				.spin(config.spinOptions);
		} else {
			imgAttr.src = 'images/loading.jpg';
		}

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
		// image and stop the spinner (if updating)
		$.get(imgUrl)
			.done(() => {
				$img.attr('src', imgUrl);
			})
			.fail(() => {
				$img.attr('src', 'images/errorstop.png');
			})
			.always(() => {
				if (this.isUpdating) {
					this.removeImage();
				}

				this.isUpdating = false;
				this.$streetviewImage
					.height('auto')
					.spin(false);
			});
	}

	removeImage() {
		this.$streetviewImage
			.removeClass('replace-image')
			.find('img')
				.eq(0)
				.remove();
	}
}
