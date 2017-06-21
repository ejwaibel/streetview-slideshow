import { Template } from './Template';

export class Slider {
	constructor(options) {
		this.elements = {
			containerSlider: '.js-container-slider',
			slider: '.js-slider',
			sliderValue: '.js-slider-value'
		};

		this.options = $.extend(true, {
			setTitle: true,
			uiSlider: {
				animate: true,
				min: 0,
				max: 180,
				range: 'min',
				create: this.onCreate.bind(this),
				change: this.onUpdate.bind(this),
				slide: this.onUpdate.bind(this),
				start: this.onStart.bind(this),
				stop: this.onStop.bind(this)
			}
		}, options);

		this.tpl = new Template(`
			<div class="row collapse">
				{{#if setTitle}}
				<div class="slider-title text-right">
					<h4>{{title}} = <span class="slider-value js-slider-value"></span></h4>
				</div>
				{{/if}}
				<div class="container-slider js-container-slider">
					<div class="js-slider">
						{{#unless setTitle}}
							<span class="slider-value js-slider-value"></span>
						{{/unless}}
					</div>
				</div>
			</div>
		`);

		this.$el = $(this.tpl.apply(this.options));

		this.$slider = this.$el.find(this.elements.slider);
		this.$sliderContainer = this.$el.find(this.elements.containerSlider);
		this.$sliderValue = this.$el.find(this.elements.sliderValue);

		this.$slider.slider(this.options.uiSlider);

		return this;
	}

	onCreate(event) {
		this.$sliderValue.text(0);
	}

	onStart(event, ui) {

	}

	onStop(event, ui) {

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
