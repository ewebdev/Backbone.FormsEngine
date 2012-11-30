$(function(){

	$.get('/config-examples/schema3.json').success(function(str) {
		var packageInfo = new Function('return ' + str)();
		var form = Backbone.FormsEngine.generate({
			target: $('#formWrapper'),
			schema: packageInfo.fields,
			title: 'Auto-Generated Form Example',
			submit: function(data) {
				console.info('submit', data);
			}
		});

		var $result = $('#jsonResult');
//		form.$el.on('change', 'input, textarea, select, click', function() {
//			return form.validate(true);
//		});
		var update = function(){
			$result.css('color', form.valid ? '' : 'red');
			$result.text(JSON.stringify(form.serialize()));
		};
		form.on('schemaChanged', update);
//		form.on('validate', update);

	});

});