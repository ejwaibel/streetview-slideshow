import init from './init';
import spinner from './libs/jquery.spin';
import { config } from './config';
import { utils } from './utils';
import { Template } from './template';

$(function() {
	init();

	var slideshowTpl = new Template(config.templates.slideshow);

	config.buttons.$startSlideshow.on('click', function(e) {
		var $images = $(config.elements.streetviewImage).clone(),
			slides = $images.map(function(index, el) {
				return el.outerHTML;
			}).toArray(),
			$scroller = $(slideshowTpl.apply({ slides: slides })),
			$dialogContent = $(config.elements.dialogContent);

		e.preventDefault();

		$dialogContent
			.empty()
			.append($scroller);
	});
});
