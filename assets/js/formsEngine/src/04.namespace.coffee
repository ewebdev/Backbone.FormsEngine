_.extend Backbone.Events,
	once: (ev, callback, context) ->
		bindCallback = _.bind ->
			this.unbind ev, bindCallback
			callback.apply(context || @, arguments)
		, this
		@bind(ev, bindCallback)
Backbone.View.prototype.once = Backbone.Model.prototype.once = Backbone.Events.once

Backbone.FormsEngine = {}