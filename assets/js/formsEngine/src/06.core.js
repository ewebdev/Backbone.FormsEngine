
(function() {
  var FormModel, FormView, FormsEngine, buildFields, generateField;
  FormsEngine = Backbone.FormsEngine;
  FormModel = Backbone.DeepModel.extend({
    validate: function(data, options) {
      return console.log('model.validate', options.attr, this.get(options.attr));
    }
  });
  FormView = Backbone.View.extend({
    initialize: function() {
      this.tabindex = 0;
      this.children = [];
      this.model = new FormModel(null, this.options.schema);
      this.on('ready', function() {
        return this.ready = true;
      });
      return this.on('change', function(e) {
        return this.model.set(e.changed, e.value, {
          validate: true
        });
      });
    },
    tagName: 'form',
    className: 'generated-form',
    events: {
      "submit": "submit"
    },
    validate: function(forceRefresh) {
      var j, r, res, view, _ref;
      res = [];
      forceRefresh = true;
      if (forceRefresh || !this.data) {
        this.serialize();
      }
      _ref = this.children;
      for (j in _ref) {
        view = _ref[j];
        r = view.validate();
        if ((r != null) && r.length) {
          res.push(r);
        }
      }
      this.valid = !res || res.length === 0;
      this.trigger('validate');
      this.trigger('validate:' + (this.valid ? 'success' : 'fail'));
      return res;
    },
    submit: function(e) {
      var errors;
      e.preventDefault();
      errors = this.validate(true);
      if (errors && (errors.length > 1 || errors[0])) {
        if ((typeof console !== "undefined" && console !== null ? console.log : void 0) != null) {
          return console.warn('INVALID, Errors:', errors);
        }
      } else {
        return this.options.submit(this.data);
      }
    },
    template: _.template("<div class=\"form-title form-actions\"><%-options.title%></div>\n<fieldset />\n<div class=\"form-actions\">\n	<button class=\"btn-primary btn\" type=\"submit\">Send</button>\n</div>"),
    render: function() {
      this.$el.html(this.template(this));
      this.$content = this.$('fieldset');
      return this;
    },
    serialize: function() {
      var j, json, view, _ref;
      json = {};
      _ref = this.children;
      for (j in _ref) {
        view = _ref[j];
        _.extend(json, view.serialize());
      }
      return this.data = json;
    }
  });
  generateField = function(options, tabIdx, path, form) {
    var View;
    View = FormsEngine.fieldTypes[options.type];
    options.tabindex = 0;
    options.path = path;
    options.form = form;
    options.rootModel = form.model;
    if (View) {
      return (new View(options)).render();
    }
    return null;
  };
  buildFields = FormsEngine.buildFields = function(schema, parent, path) {
    var fields, i, v, view;
    fields = (function() {
      var _results;
      _results = [];
      for (i in schema) {
        v = schema[i];
        view = generateField(v, i + 1, (parent.path ? parent.path + '.' + parent.name : parent.name), parent.form || parent);
        view.$el.appendTo(parent.$content);
        _results.push(parent.children.push(view));
      }
      return _results;
    })();
    if (!parent.form) {
      parent.trigger('ready');
    }
    return view;
  };
  return FormsEngine.generate = function(options) {
    var form;
    this.options = options;
    form = new FormView(options).render();
    form.$el.appendTo(options.target);
    buildFields(options.schema, form, '');
    return form;
  };
})();
