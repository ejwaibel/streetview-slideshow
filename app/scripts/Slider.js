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

	setOption(options) {
		this.$slider.slider('option', options);

		return this;
	}

	getValue() {
		return this.$slider.slider('value');
	}

	setValue(val) {
		this.$slider.slider('value', val);

		return this;
	}
}
