( ->
	FormsEngine = Backbone.FormsEngine

	FieldType = FormsEngine.FieldType = Backbone.View.extend
		initialize: (options) ->
			@name = options.name
			@path = options.path
			@rootModel = options.rootModel
			@fullname = if options.path then options.path + '.' + options.name else options.name
			@children = []
			@form = options.form
			@$el.addClass options.type.toLowerCase() + '-field-wrapper'
			validation = options.validation
			if validation
				@rootModel.on 'change:' + @fullname, @validate, @
				@required = (rule for rule in options.validation when rule and (rule.required is true or rule.minLength > 0)).length > 0
			else
				@required = false
			@$el.addClass('required') if @required
			ev = {}
			ev['keydown ' + @fieldTagName] = () ->
				setTimeout =>
					@updateFromDOM()
				, 10
			ev[@changeEventName + ' ' + @fieldTagName] = @updateFromDOM
			ev['click .errors-block'] = @clearValidation
			@delegateEvents ev
		updateFromDOM: ->
#			@clearValidation()
			@rootModel.set(@fullname, @get(), {validate: false});
		#		doValidation: ->
		#			if (@checkModify())
		#				@validate(true)
		#			else
		#				@clearValidation()
#		checkModify: ->
#			newVal = @get()
#			if newVal isnt @_val
#				prev = @_val
#				@_val = newVal
#				@form.trigger 'change:' + @fullname, {changed: @fullname, value: newVal, previous: prev, view: @}, newVal
#				@form.trigger 'change', {changed: @fullname, value: newVal, previous: prev, view: @}, newVal
#			newVal
		changeEventName: 'change'
		fieldTagName: 'input'
		className: 'field-wrapper'
		inputType: undefined
		template: _.template """
												 <label for=\"<%=cid%>\" class=\"control-label\"><%-options.caption%></label>
												 <div class=\"controls\">
												 <%=controlTemplate(this)%>
												 </div>
												 <span class=\"help-block\"><%-options.description || ''%></span>
												 <span class=\"errors-block\" style=\"display: none;\"><div class=\"tip\" ></div><ul><%-options.errors || ''%></ul></span>
												 """
		controlTemplate: _.template """
																<<%-fieldTagName%> id="<%=cid%>" name="<%=fullname%>"<%=inputType ? ' type="' + inputType + '"' : ''%><%=options.placeholder ? ' placeholder="' + options.placeholder + '"' : ''%> tabindex="<%=options.tabindex%>"></<%-fieldTagName%>>
																"""
		validate: ->
#			if (not @form.data)
#				@form.serialize()
			errors = Validation.validate(@name, @get(), @options.validation, this.rootModel.attributes, @options.caption || @name)
			console.log errors
			if typeof errors is 'string' then errors = [errors]
			if errors? and errors.length
				@onInvalid errors
				@hasErrors = true
			else if @hasErrors
				@clearValidation()
			return errors
		onInvalid: (errors)->
			errs = for err in errors
				"<li>#{err}</li>"
			@$('.errors-block ul').html(errs.join('')).parent().show()
			@$el.addClass 'invalid'
		clearValidation: ->
			@$('.errors-block').hide()
			@$el.removeClass 'invalid'
			@hasErrors = false
		get: ->
			@$("#{@fieldTagName}[name='#{@fullname}']").val()
		serialize: ->
			json = {}
			json[@name] = @get()
			json
		render: ->
			@$el.html @template(@)
			@$content = @$el
			FormsEngine.buildFields(@options.items, @)
			@onRender?()
			@

	fieldTypes = FormsEngine.fieldTypes = {}
	fieldTypes.String = FieldType.extend
		inputType: 'text'

	fieldTypes.Text = FieldType.extend
		fieldTagName: 'textarea'

	fieldTypes.Password = FieldType.extend
		inputType: 'password'

	fieldTypes.Boolean = FieldType.extend
		inputType: 'checkbox'
		changeEventName: 'click'
		serialize: ->
			json = {}
			json[@name] = @get()
			json
		get: ->
			@$("#{@fieldTagName}[name='#{@fullname}']").prop 'checked'


	fieldTypes.Email = FieldType.extend
		inputType: 'email'

	fieldTypes.Url = FieldType.extend
		inputType: 'url'

	fieldTypes.Set = FieldType.extend
		initialize: (options) ->
			FieldType.prototype.initialize.call(this, options);
			if options.multiSelect?
				if typeof options.maxSelected is 'number'
					options.multiSelect = options.maxSelected > 1
			else options.multiSelect = typeof options.maxSelected is 'number' and options.maxSelected > 1
			if (typeof options.maxSelected isnt 'number')
				options.maxSelected = if options.multiSelect then Infinity else 1
			if options.items.length <= 6
				@fieldTagName = 'input'
				@inputType = if options.multiSelect then 'checkbox' else 'radio'
			else
				@fieldTagName = 'select'
		get: ->
			if @fieldTagName is 'select'
				return @$("select").val()
			else if @inputType is 'radio'
				return @$("input:checked").val()
			else #checkbox
				@$("input:checked").map ->
					return $(@).val()
					.toArray()
		controlTemplate: _.template """
																<% if (fieldTagName === 'select') { %>
																<select name="<%=fullname%>"<%=options.multiSelect ? ' multiple' : ''%> data-max-selected="<%=options.maxSelected === Infinity ? undefined : options.maxSelected%>" class="chzn-select"<%=options.placeholder ? ' data-placeholder="' + options.placeholder + '"' : ''%> style="width:350px;" tabindex="<%=options.tabindex%>">
																<% _.each(options.items, function(item){ %>
																<option value="<%-item.value !== undefined ? item.value : item%>"><%-item.caption !== undefined ? item.caption : item.value || item%></option>
																<% }); %>
																</select>
																<% } else if(inputType === 'radio') { %>
																<div class="group">
																<% _.each(options.items, function(item, i){ %>
																<div class="option">
																<input id="radio_<%-cid%>_<%-i%>" type="radio" name="<%=fullname%>" value="<%-item.value !== undefined ? item.value : item%>" tabindex="<%=options.tabindex%>" />
																<label for="radio_<%-cid%>_<%-i%>"><%-item.caption !== undefined ? item.caption : item.value || item%></label>
																</div>
																<% }); %>
																</div>
																<% } else { %>
																<div class="group">
																<% _.each(options.items, function(item, i){ %>
																<div class="option">
																<input id="checkbox_<%-cid%>_<%-i%>" type="checkbox" name="<%=fullname%>" value="<%-item.value !== undefined ? item.value : item%>" tabindex="<%=options.tabindex%>" />
																<label for="checkbox_<%-cid%>_<%-i%>"><%-item.caption !== undefined ? item.caption : item.value || item%></label>
																</div>
																<% }); %>
																</div>
																<% } %>
																"""
		render: ()->
			@$el.html @template(@)
			@$content = @$el
			@onRender?()
			@
		onRender: ->
			@form.on('ready', @onFormReady, @)
		onFormReady: ->
			@$("select.chzn-select").chosen(allow_single_deselect: true, max_selected_options: @options.maxSelected)

	FieldsGroup = Backbone.View.extend
		initialize: (options) ->
			@name = options.name
			@path = options.path
			@fullname = if options.path then options.path + '.' + options.name else options.name
			@children = []
			@form = @options.form
		validate: ->
			res = []
			for j, view of @children
				r = view.validate()
				if r then res = res.concat r
			if not res then null else [].concat res

	fieldTypes.Section = FieldsGroup.extend
		className: 'section-wrapper'
		template: _.template """
												 <% if (options.caption) { %>
												 <div class=\"group-title\"><%-options.caption%></div>
												 <% } %>
												 <div class=\"group-items\"></div>
												 """
		render: ->
			@$el.html @template(@)
			@$content = @$('.group-items')
			FormsEngine.buildFields @options.items, @
			@onRender?()
			@
		serialize: ->
			json = {}
			obj = {}
			for j, view of @children
				_.extend(json, view.serialize());
			obj[@name] = json
			obj

	fieldTypes.CompositeChild = FieldsGroup.extend
		className: 'child-wrapper'
		path: null
		events:
			'click .remove-item-btn': 'removeItem'
		template: _.template """
												 <% if (options.caption) { %>
												 <h3 class=\"section-title\"><%-options.caption%></h3>
												 <% } %>
												 <div class="composite-fields"></div>
												 <div class=\"composite-controls\">
												 <button type=\"button\" class=\"btn remove-item-btn\"><i class=\"icon-minus\"></i> Remove</button>
												 </div>
												 """
		removeItem: (e) ->
			e.preventDefault()
			@trigger 'doRemove', @
		serialize: ->
			json = {}
			for j, view of @children
				_.extend(json, view.serialize())
			json
		render: ->
			@$el.html @template(@)
			@$el.attr 'id', @cid
			@$content = @$('.composite-fields')
			FormsEngine.buildFields @options.items, @
			@onRender?()
			@

	fieldTypes.Composite = FieldsGroup.extend
		initialize: (options) ->
			options.items = [] if not options.items
			@constructor.__super__.initialize.apply this, arguments
			@name = options.name
		className: 'composite-wrapper',
		children: [],
		events:
			'click .add-item-btn': 'newItem'
		newItem: (e) ->
			e.preventDefault()
			opts = items:
				{ name: @name, type: 'CompositeChild', items: @options.fields }
			form = @options.form
			@options.items.push opts
			view = FormsEngine.buildFields opts, @
			view.once 'doRemove', () =>
				view.$el.remove()
				@options.items.splice(view.$el.index(), 1)
				@children.splice(view.$el.index(), 1)
				form.$el.trigger('removeItem')
				form.trigger('schemaChanged')
				@updateTitle()
				form.trigger('ready')
			@updateTitle()
			form.$el.trigger('addItem')
			form.trigger('schemaChanged')
			form.trigger('ready')
		updateTitle: ->
			@$el[if @options.items.length is 0 then 'addClass' else 'removeClass'] 'empty'
			@$('.title-status').html(@titleStatusTemplate(@))
		titleStatusTemplate: _.template """
																		(<%-options.items.length%> items)
																		"""
		template: _.template """
												 <div class=\"group-title\">
												 <div class=\"title-inner\"><%-options.caption%></div>
												 <div class=\"group-controls\">
												 <button type=\"button\" class=\"btn add-item-btn\"><i class=\"icon-plus\"></i> Add</button>
												 <span class=\"title-status\"><%= titleStatusTemplate(this) %></span>
												 </div>
												 </div>
												 <div class="group-items"></div>
												 """
		onRender: ->
			@updateTitle()
		#	validate: ->
		#		res = []
		#		for j, view of @children
		#			r = view.validate()
		#			if r then res = res.concat r
		#		if not res then null else [].concat res
		#		@constructor.__super__.validate.apply this, arguments

		serialize: ->
			arr = []
			for j, view of @children
				arr.push view.serialize()
			json = {}
			json[@name] = arr
			json
		render: ()->
			@$el.html @template(@)
			@$content = @$('.group-items')
			FormsEngine.buildFields @options.items, @
			@onRender?()
			@
)()