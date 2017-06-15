let _sliders = {};

export class Slider {
	constructor($el, opts) {
		this.elements = {
			containerSlider: '.js-container-slider',
			slider: '.js-slider',
			sliderValue: '.js-slider-value'
		};

		this.$sliderValue = $el
					.parents(this.elements.containerSlider)
					.find(this.elements.sliderValue);

		this.options = $.extend(true, {
			animate: true,
			min: 0,
			max: 180,
			range: 'min',
			create: this.onCreate.bind(this),
			change: this.onUpdate.bind(this),
			slide: this.onUpdate.bind(this)
		}, opts);

		this.$slider = $el.slider(this.options);
	}

	onCreate(event) {
		this.$sliderValue.text(0);
	}

	onUpdate(event, ui) {
		this.$sliderValue.text(ui.value);
	}

	update(options) {
		this.$slider.slider('option', options);

		return this;
	}

	get value() {
		return window.parseInt(this.$slider.slider('value'), 10);
	}

	set value(val) {
		this.$slider.slider('value', val);

		return this;
	}
}
