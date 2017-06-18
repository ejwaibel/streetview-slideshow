export class Slider {
	constructor(opts, uiOptions) {
		this.elements = {
			containerSlider: '.js-container-slider',
			slider: '.js-slider',
			sliderValue: '.js-slider-value'
		};

		this.$el = $(`
			<div class="row collapse">
				<h4 class="slider-title text-center">${opts.title}</h4>
				<div class="container-slider js-container-slider">
					<div class="js-slider">
						<span class="slider-value js-slider-value"></span>
					</div>
				</div>
			</div>
		`);

		this.$slider = this.$el.find(this.elements.slider);
		this.$sliderValue = this.$el.find(this.elements.sliderValue);

		this.options = $.extend(true, {
			animate: true,
			min: 0,
			max: 180,
			range: 'min',
			create: this.onCreate.bind(this),
			change: this.onUpdate.bind(this),
			slide: this.onUpdate.bind(this)
		}, uiOptions);

		this.$slider.slider(this.options);

		return this;
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
