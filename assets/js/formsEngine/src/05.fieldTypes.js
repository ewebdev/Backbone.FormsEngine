
(function() {
  var FieldType, FieldsGroup, FormsEngine, fieldTypes;
  FormsEngine = Backbone.FormsEngine;
  FieldType = FormsEngine.FieldType = Backbone.View.extend({
    initialize: function(options) {
      var ev, rule, validation;
      this.name = options.name;
      this.path = options.path;
      this.rootModel = options.rootModel;
      this.fullname = options.path ? options.path + '.' + options.name : options.name;
      this.children = [];
      this.form = options.form;
      this.$el.addClass(options.type.toLowerCase() + '-field-wrapper');
      validation = options.validation;
      if (validation) {
        this.rootModel.on('change:' + this.fullname, this.validate, this);
        this.required = ((function() {
          var _i, _len, _ref, _results;
          _ref = options.validation;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            rule = _ref[_i];
            if (rule && (rule.required === true || rule.minLength > 0)) {
              _results.push(rule);
            }
          }
          return _results;
        })()).length > 0;
      } else {
        this.required = false;
      }
      if (this.required) {
        this.$el.addClass('required');
      }
      ev = {};
      ev['keydown ' + this.fieldTagName] = function() {
        var _this = this;
        return setTimeout(function() {
          return _this.updateFromDOM();
        }, 10);
      };
      ev[this.changeEventName + ' ' + this.fieldTagName] = this.updateFromDOM;
      ev['click .errors-block'] = this.clearValidation;
      return this.delegateEvents(ev);
    },
    updateFromDOM: function() {
      return this.rootModel.set(this.fullname, this.get(), {
        validate: false
      });
    },
    changeEventName: 'change',
    fieldTagName: 'input',
    className: 'field-wrapper',
    inputType: void 0,
    template: _.template("<label for=\"<%=cid%>\" class=\"control-label\"><%-options.caption%></label>\n<div class=\"controls\">\n<%=controlTemplate(this)%>\n</div>\n<span class=\"help-block\"><%-options.description || ''%></span>\n<span class=\"errors-block\" style=\"display: none;\"><div class=\"tip\" ></div><ul><%-options.errors || ''%></ul></span>"),
    controlTemplate: _.template("<<%-fieldTagName%> id=\"<%=cid%>\" name=\"<%=fullname%>\"<%=inputType ? ' type=\"' + inputType + '\"' : ''%><%=options.placeholder ? ' placeholder=\"' + options.placeholder + '\"' : ''%> tabindex=\"<%=options.tabindex%>\"></<%-fieldTagName%>>"),
    validate: function() {
      var errors;
      errors = Validation.validate(this.name, this.get(), this.options.validation, this.rootModel.attributes, this.options.caption || this.name);
      console.log(errors);
      if (typeof errors === 'string') {
        errors = [errors];
      }
      if ((errors != null) && errors.length) {
        this.onInvalid(errors);
        this.hasErrors = true;
      } else if (this.hasErrors) {
        this.clearValidation();
      }
      return errors;
    },
    onInvalid: function(errors) {
      var err, errs;
      errs = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = errors.length; _i < _len; _i++) {
          err = errors[_i];
          _results.push("<li>" + err + "</li>");
        }
        return _results;
      })();
      this.$('.errors-block ul').html(errs.join('')).parent().show();
      return this.$el.addClass('invalid');
    },
    clearValidation: function() {
      this.$('.errors-block').hide();
      this.$el.removeClass('invalid');
      return this.hasErrors = false;
    },
    get: function() {
      return this.$("" + this.fieldTagName + "[name='" + this.fullname + "']").val();
    },
    serialize: function() {
      var json;
      json = {};
      json[this.name] = this.get();
      return json;
    },
    render: function() {
      this.$el.html(this.template(this));
      this.$content = this.$el;
      FormsEngine.buildFields(this.options.items, this);
      if (typeof this.onRender === "function") {
        this.onRender();
      }
      return this;
    }
  });
  fieldTypes = FormsEngine.fieldTypes = {};
  fieldTypes.String = FieldType.extend({
    inputType: 'text'
  });
  fieldTypes.Text = FieldType.extend({
    fieldTagName: 'textarea'
  });
  fieldTypes.Password = FieldType.extend({
    inputType: 'password'
  });
  fieldTypes.Boolean = FieldType.extend({
    inputType: 'checkbox',
    changeEventName: 'click',
    serialize: function() {
      var json;
      json = {};
      json[this.name] = this.get();
      return json;
    },
    get: function() {
      return this.$("" + this.fieldTagName + "[name='" + this.fullname + "']").prop('checked');
    }
  });
  fieldTypes.Email = FieldType.extend({
    inputType: 'email'
  });
  fieldTypes.Url = FieldType.extend({
    inputType: 'url'
  });
  fieldTypes.Set = FieldType.extend({
    initialize: function(options) {
      FieldType.prototype.initialize.call(this, options);
      if (options.multiSelect != null) {
        if (typeof options.maxSelected === 'number') {
          options.multiSelect = options.maxSelected > 1;
        }
      } else {
        options.multiSelect = typeof options.maxSelected === 'number' && options.maxSelected > 1;
      }
      if (typeof options.maxSelected !== 'number') {
        options.maxSelected = options.multiSelect ? Infinity : 1;
      }
      if (options.items.length <= 6) {
        this.fieldTagName = 'input';
        return this.inputType = options.multiSelect ? 'checkbox' : 'radio';
      } else {
        return this.fieldTagName = 'select';
      }
    },
    get: function() {
      if (this.fieldTagName === 'select') {
        return this.$("select").val();
      } else if (this.inputType === 'radio') {
        return this.$("input:checked").val();
      } else {
        return this.$("input:checked").map(function() {
          return $(this).val().toArray();
        });
      }
    },
    controlTemplate: _.template("<% if (fieldTagName === 'select') { %>\n<select name=\"<%=fullname%>\"<%=options.multiSelect ? ' multiple' : ''%> data-max-selected=\"<%=options.maxSelected === Infinity ? undefined : options.maxSelected%>\" class=\"chzn-select\"<%=options.placeholder ? ' data-placeholder=\"' + options.placeholder + '\"' : ''%> style=\"width:350px;\" tabindex=\"<%=options.tabindex%>\">\n<% _.each(options.items, function(item){ %>\n<option value=\"<%-item.value !== undefined ? item.value : item%>\"><%-item.caption !== undefined ? item.caption : item.value || item%></option>\n<% }); %>\n</select>\n<% } else if(inputType === 'radio') { %>\n<div class=\"group\">\n<% _.each(options.items, function(item, i){ %>\n<div class=\"option\">\n<input id=\"radio_<%-cid%>_<%-i%>\" type=\"radio\" name=\"<%=fullname%>\" value=\"<%-item.value !== undefined ? item.value : item%>\" tabindex=\"<%=options.tabindex%>\" />\n<label for=\"radio_<%-cid%>_<%-i%>\"><%-item.caption !== undefined ? item.caption : item.value || item%></label>\n</div>\n<% }); %>\n</div>\n<% } else { %>\n<div class=\"group\">\n<% _.each(options.items, function(item, i){ %>\n<div class=\"option\">\n<input id=\"checkbox_<%-cid%>_<%-i%>\" type=\"checkbox\" name=\"<%=fullname%>\" value=\"<%-item.value !== undefined ? item.value : item%>\" tabindex=\"<%=options.tabindex%>\" />\n<label for=\"checkbox_<%-cid%>_<%-i%>\"><%-item.caption !== undefined ? item.caption : item.value || item%></label>\n</div>\n<% }); %>\n</div>\n<% } %>"),
    render: function() {
      this.$el.html(this.template(this));
      this.$content = this.$el;
      if (typeof this.onRender === "function") {
        this.onRender();
      }
      return this;
    },
    onRender: function() {
      return this.form.on('ready', this.onFormReady, this);
    },
    onFormReady: function() {
      return this.$("select.chzn-select").chosen({
        allow_single_deselect: true,
        max_selected_options: this.options.maxSelected
      });
    }
  });
  FieldsGroup = Backbone.View.extend({
    initialize: function(options) {
      this.name = options.name;
      this.path = options.path;
      this.fullname = options.path ? options.path + '.' + options.name : options.name;
      this.children = [];
      return this.form = this.options.form;
    },
    validate: function() {
      var j, r, res, view, _ref;
      res = [];
      _ref = this.children;
      for (j in _ref) {
        view = _ref[j];
        r = view.validate();
        if (r) {
          res = res.concat(r);
        }
      }
      if (!res) {
        return null;
      } else {
        return [].concat(res);
      }
    }
  });
  fieldTypes.Section = FieldsGroup.extend({
    className: 'section-wrapper',
    template: _.template("<% if (options.caption) { %>\n<div class=\"group-title\"><%-options.caption%></div>\n<% } %>\n<div class=\"group-items\"></div>"),
    render: function() {
      this.$el.html(this.template(this));
      this.$content = this.$('.group-items');
      FormsEngine.buildFields(this.options.items, this);
      if (typeof this.onRender === "function") {
        this.onRender();
      }
      return this;
    },
    serialize: function() {
      var j, json, obj, view, _ref;
      json = {};
      obj = {};
      _ref = this.children;
      for (j in _ref) {
        view = _ref[j];
        _.extend(json, view.serialize());
      }
      obj[this.name] = json;
      return obj;
    }
  });
  fieldTypes.CompositeChild = FieldsGroup.extend({
    className: 'child-wrapper',
    path: null,
    events: {
      'click .remove-item-btn': 'removeItem'
    },
    template: _.template("<% if (options.caption) { %>\n<h3 class=\"section-title\"><%-options.caption%></h3>\n<% } %>\n<div class=\"composite-fields\"></div>\n<div class=\"composite-controls\">\n<button type=\"button\" class=\"btn remove-item-btn\"><i class=\"icon-minus\"></i> Remove</button>\n</div>"),
    removeItem: function(e) {
      e.preventDefault();
      return this.trigger('doRemove', this);
    },
    serialize: function() {
      var j, json, view, _ref;
      json = {};
      _ref = this.children;
      for (j in _ref) {
        view = _ref[j];
        _.extend(json, view.serialize());
      }
      return json;
    },
    render: function() {
      this.$el.html(this.template(this));
      this.$el.attr('id', this.cid);
      this.$content = this.$('.composite-fields');
      FormsEngine.buildFields(this.options.items, this);
      if (typeof this.onRender === "function") {
        this.onRender();
      }
      return this;
    }
  });
  return fieldTypes.Composite = FieldsGroup.extend({
    initialize: function(options) {
      if (!options.items) {
        options.items = [];
      }
      this.constructor.__super__.initialize.apply(this, arguments);
      return this.name = options.name;
    },
    className: 'composite-wrapper',
    children: [],
    events: {
      'click .add-item-btn': 'newItem'
    },
    newItem: function(e) {
      var form, opts, view,
        _this = this;
      e.preventDefault();
      opts = {
        items: {
          name: this.name,
          type: 'CompositeChild',
          items: this.options.fields
        }
      };
      form = this.options.form;
      this.options.items.push(opts);
      view = FormsEngine.buildFields(opts, this);
      view.once('doRemove', function() {
        view.$el.remove();
        _this.options.items.splice(view.$el.index(), 1);
        _this.children.splice(view.$el.index(), 1);
        form.$el.trigger('removeItem');
        form.trigger('schemaChanged');
        _this.updateTitle();
        return form.trigger('ready');
      });
      this.updateTitle();
      form.$el.trigger('addItem');
      form.trigger('schemaChanged');
      return form.trigger('ready');
    },
    updateTitle: function() {
      this.$el[this.options.items.length === 0 ? 'addClass' : 'removeClass']('empty');
      return this.$('.title-status').html(this.titleStatusTemplate(this));
    },
    titleStatusTemplate: _.template("(<%-options.items.length%> items)"),
    template: _.template("<div class=\"group-title\">\n<div class=\"title-inner\"><%-options.caption%></div>\n<div class=\"group-controls\">\n<button type=\"button\" class=\"btn add-item-btn\"><i class=\"icon-plus\"></i> Add</button>\n<span class=\"title-status\"><%= titleStatusTemplate(this) %></span>\n</div>\n</div>\n<div class=\"group-items\"></div>"),
    onRender: function() {
      return this.updateTitle();
    },
    serialize: function() {
      var arr, j, json, view, _ref;
      arr = [];
      _ref = this.children;
      for (j in _ref) {
        view = _ref[j];
        arr.push(view.serialize());
      }
      json = {};
      json[this.name] = arr;
      return json;
    },
    render: function() {
      this.$el.html(this.template(this));
      this.$content = this.$('.group-items');
      FormsEngine.buildFields(this.options.items, this);
      if (typeof this.onRender === "function") {
        this.onRender();
      }
      return this;
    }
  });
})();
