'use strict';

(function() {
	var Template = function(config) {
		this._template = null;

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
	};

	Template.prototype.init = function(template) {
		this._template = Hogan.compile(template.replace(/[\r\n\t]+/gm, '').replace(/<!--.*?-->/g, ''));

		return this;
	};

	Template.prototype.apply = function(map, partials) {
		var mappedPartials = {}, key;

		for (key in partials) {
			mappedPartials[key] = partials[key] instanceof Template ? partials[key].toString() : partials[key];
		}

		return this._template.render(map, mappedPartials);
	};

	Template.prototype.toString = function() {
		return this._template.text;
	};

	leopard.tpl = Template;
})();
