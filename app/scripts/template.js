'use strict';

export class Template {
	constructor(config) {
		this.tpl = null;

		if (typeof config === 'string') {
			this.init(config);
		} else if (typeof config === 'object') {
			if (config.template) {
				this.init(config.template);
			}

			if (config.onLoad) {
				this.onLoad = config.onLoad;
			}
		}
	}

	init(template) {
		this.tpl = Handlebars.compile(template.replace(/[\r\n\t]+/gm, ''));
	}

	apply(map, partials) {
		var mappedPartials = {},
			key;

		for (key in partials) {
			mappedPartials[key] = partials[key] instanceof Template ? partials[key].toString() : partials[key];
		}

		return this.tpl(map, mappedPartials);
	};

	toString() {
		return this.tpl.text;
	};
}
