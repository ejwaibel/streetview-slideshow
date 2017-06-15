// Extended disable function
(function($) {
	$.fn.extend({
		disable: function(state) {
			return this.each(function() {
				var $this = $(this);

				if ($this.is('input, button')) {
					this.disabled = state;
				}

				$this.toggleClass('disabled', state);
			});
		}
	});
})(window.jQuery);
