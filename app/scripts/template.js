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

	apply(map) {
		return this.tpl(map);
	};

	toString() {
		return this.tpl.toString();
	};
}
