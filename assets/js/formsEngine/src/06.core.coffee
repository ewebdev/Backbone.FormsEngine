(->
	FormsEngine = Backbone.FormsEngine

	FormView = Backbone.View.extend
		initialize: () ->
			@tabindex = 0
			@children = []
			@on 'ready', ->
				@ready = true
		tagName: 'form'
		className: 'generated-form'
		events:
			"submit": "submit"
		validate: (forceRefresh) ->
			res = []
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
			errors = @validate()
			if (errors && (errors.length > 1 || errors[0]))
				if console?.log?
					console.log 'INVALID, Errors:'
					console.log errors
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

	generateField = (options, tabIdx, namePrefix, form) ->
		View = FormsEngine.fieldTypes[options.type]
#		options.tabindex = ++form.tabindex
		options.tabindex = 0
		options.namePrefix = namePrefix
		options.form = form
		if View
			return (new View (options)).render()
		null

	buildFields = FormsEngine.buildFields = (schema, parent, namePrefix) ->
		fields = for i, v of schema
			view = generateField(v, i+1, namePrefix, parent.form || parent)
			view.$el.appendTo parent.$content
			parent.children.push(view)
		if (!parent.form)
			parent.trigger 'ready'
		view

	FormsEngine.generate = (@options) ->
		form = new FormView(@options).render()
		form.$el.appendTo options.target
		buildFields options.schema, form
		form
)()