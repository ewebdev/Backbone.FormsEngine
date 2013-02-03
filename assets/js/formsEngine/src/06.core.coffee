(->
	FormsEngine = Backbone.FormsEngine

#
#	MixedModel = (attributes, options) ->
#		attrs = attributes or {}
#		@cid = _.uniqueId 'c'
#		@set attrs, {silent: true}
#		@initialize.apply @, arguments
#		@
#
#	_.extend MixedModel.prototype, Backbone.Events,
#		initialize: ->
#		get: (path) ->
#			s = path.split '.'
#			k = @data
#			while ((p = s.shift()) and k)
#				k = k[p]
#			k
#		set: (path, value) ->
#			if typeof path is 'object'
#				data = path
#				opts = value
#				@data = _.extend @data or {}, data
#			else
#				s = path.split '.'
#				k = @data
#				while (p = s.shift())
#					if p.length
#						k[p] = {} if not k[p] or not typeof k[p] is 'object'
#					if (!s.length)
#						k[p] = value
#					else
#						k = k[p]
#			@
#		toJSON: ->
#			@data


	FormModel = Backbone.DeepModel.extend
#		initialize: (data, schema) ->
#			@schema = schema
		validate: (data, options) ->
			console.log 'model.validate', options.attr, @get(options.attr)


	FormView = Backbone.View.extend
		initialize: () ->
			@tabindex = 0
			@children = []
			@model = new FormModel(null, @options.schema)
			@on 'ready', ->
				@ready = true
			@on 'change', (e) ->
				@model.set e.changed, e.value, {validate: true}
		tagName: 'form'
		className: 'generated-form'
		events:
			"submit": "submit"
		validate: (forceRefresh) ->
			res = []
			forceRefresh = true
			if forceRefresh or not @data
				@serialize()
			for j, view of @children
				r = view.validate()
				res.push r if r? and r.length
			@valid = not res or res.length is 0
			@trigger 'validate'
			@trigger 'validate:' + (if @valid then 'success' else 'fail')
			res
		submit: (e) ->
			e.preventDefault()
			errors = @validate(true)
			if (errors && (errors.length > 1 || errors[0]))
				if console?.log?
					console.warn 'INVALID, Errors:', errors
			else
#				console?.log? 'OK'
				@options.submit @data
		template: _.template """
			<div class="form-title form-actions"><%-options.title%></div>
			<fieldset />
			<div class="form-actions">
				<button class="btn-primary btn" type="submit">Send</button>
			</div>
			"""
		render: () ->
			@$el.html @template(@)
			@$content = @$('fieldset')
			@
		serialize: ->
			json = {}
			for j, view of @children
				_.extend json, view.serialize()
			@data = json

	generateField = (options, tabIdx, path, form) ->
		View = FormsEngine.fieldTypes[options.type]
#		options.tabindex = ++form.tabindex
		options.tabindex = 0
		options.path = path
		options.form = form
		options.rootModel = form.model
		if View
			return (new View (options)).render()
		null

	buildFields = FormsEngine.buildFields = (schema, parent, path) ->
		fields = for i, v of schema
			view = generateField(v, i+1, (if parent.path then (parent.path + '.' + parent.name) else parent.name), parent.form || parent)
			view.$el.appendTo parent.$content
			parent.children.push(view)
		if (!parent.form)
			parent.trigger 'ready'
		view

	FormsEngine.generate = (@options) ->
		form = new FormView(options).render()
		form.$el.appendTo options.target
		buildFields options.schema, form, ''
		form
)()