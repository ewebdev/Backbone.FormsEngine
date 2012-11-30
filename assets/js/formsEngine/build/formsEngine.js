(function(){
/*
	Backbone.FormsEngine
	By Eyal Weiss
*/


// Validation part was forked from Backbone.Validation

// Default options
// ---------------

var defaultOptions = {
	forceUpdate: false,
	selector: 'name',
	labelFormatter: 'sentenceCase',
	valid: Function.prototype,
	invalid: Function.prototype
};


var Validation = {};


Validation.validate = function (fieldName, value, rules, data, fieldCaption) {
	if (rules) {
		return validateAttr(rules, fieldCaption, value, data, fieldCaption);
	}
//	if (typeof errors === 'array') {
//		return _.filter(errors, function (v) {
//			return v !== null;
//		});
//	}
};

// Helper functions
// ----------------

// Formatting functions used for formatting error messages
var formatFunctions = {
	// Uses the configured label formatter to format the attribute name
	// to make it more readable for the user
	formatLabel: function (attrName, model) {
		return defaultLabelFormatters[defaultOptions.labelFormatter](attrName, model);
	},

	// Replaces nummeric placeholders like {0} in a string with arguments
	// passed to the function
	format: function () {
		var args = Array.prototype.slice.call(arguments);
		var text = args.shift();
		return text.replace(/\{(\d+)\}/g, function (match, number) {
			return typeof args[number] !== 'undefined' ? args[number] : match;
		});
	}
};

// Looks on the model for validations for a specified
// attribute. Returns an array of any validators defined,
// or an empty array if none is defined.
var getValidators = function (rules, attr) {
	var attrValidationSet = rules;

	// If the validator is a function or a string, wrap it in a function validator
	if (_.isFunction(attrValidationSet) || _.isString(attrValidationSet)) {
		attrValidationSet = {
			fn: attrValidationSet
		};
	}

	// Stick the validator object into an array
	if (!_.isArray(attrValidationSet)) {
		attrValidationSet = [attrValidationSet];
	}

	// Reduces the array of validators into a new array with objects
	// with a validation method to call, the value to validate against
	// and the specified error message, if any
	return _.reduce(attrValidationSet, function (memo, attrValidation) {
		_.each(_.without(_.keys(attrValidation), 'msg'), function (validator) {
			memo.push({
				fn: defaultValidators[validator],
				val: attrValidation[validator],
				msg: attrValidation.msg
			});
		});
		return memo;
	}, []);
};

// Validates an attribute against all validators defined
// for that attribute. If one or more errors are found,
// the first error message is returned.
// If the attribute is valid, an empty string is returned.
var validateAttr = function (rules, attr, value, computed, fieldCaption) {
	// Reduces the array of validators to an error message by
	// applying all the validators and returning the first error
	// message, if any.
	return _.reduce(getValidators(rules, attr), function (memo, validator) {
		// Pass the format functions plus the default
		// validators as the context to the validator
		var ctx = _.extend({}, formatFunctions, defaultValidators),
			result = validator.fn.call(ctx, value, attr, validator.val, attr, computed);

		if (result === false || memo === false) {
			return false;
		}
		if (result && !memo) {
			return validator.msg || result;
		}
		return memo;
	}, null);
};


// Patterns
// --------

var defaultPatterns = Validation.patterns = {
	// Matches any digit(s) (i.e. 0-9)
	digits: /^\d+$/,

	// Matched any number (e.g. 100.000)
	number: /^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/,

	// Matches a valid email address (e.g. mail@example.com)
	email: /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i,

	// Mathes any valid url (e.g. http://www.xample.com)
	url: /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i
};


// Error messages
// --------------

// Error message for the build in validators.
// {x} gets swapped out with arguments form the validator.
var defaultMessages = Validation.messages = {
	required: '{0} is required',
	acceptance: '{0} must be accepted',
	min: '{0} must be greater than or equal to {1}',
	max: '{0} must be less than or equal to {1}',
	range: '{0} must be between {1} and {2}',
	length: '{0} must be {1} characters',
	minLength: '{0} must be at least {1} characters',
	maxLength: '{0} must be at most {1} characters',
	rangeLength: '{0} must be between {1} and {2} characters',
	oneOf: '{0} must be one of: {1}',
	equalTo: '{0} must be the same as {1}',
	pattern: '{0} must be a valid {1}'
};

// Label formatters
// ----------------

// Label formatters are used to convert the attribute name
// to a more human friendly label when using the built in
// error messages.
// Configure which one to use with a call to
//
//     Backbone.Validation.configure({
//       labelFormatter: 'label'
//     });
var defaultLabelFormatters = Validation.labelFormatters = {

	// Returns the attribute name with applying any formatting
	none: function (attrName) {
		return attrName;
	},

	// Converts attributeName or attribute_name to Attribute name
	sentenceCase: function (attrName) {
		return attrName.replace(/(?:^\w|[A-Z]|\b\w)/g,function (match, index) {
			return index === 0 ? match.toUpperCase() : ' ' + match.toLowerCase();
		}).replace('_', ' ');
	},

	// Looks for a label configured on the model and returns it
	//
	//      var Model = Backbone.Model.extend({
	//        validation: {
	//          someAttribute: {
	//            required: true
	//          }
	//        },
	//
	//        labels: {
	//          someAttribute: 'Custom label'
	//        }
	//      });
	label: function (attrName) {
		return defaultLabelFormatters.sentenceCase(attrName);
	}
};


var getFlat = function(key, data) {
	var s = key.split('.');
	var p;
	var k = data;
	while ((p = s.shift()) && k) {
		k = k[p]
	}
	return k;
};

// Built in validators
// -------------------

var defaultValidators = Validation.validators = (function () {
	// Use native trim when defined
	var trim = String.prototype.trim ?
		function (text) {
			return text === null ? '' : String.prototype.trim.call(text);
		} :
		function (text) {
			var trimLeft = /^\s+/,
				trimRight = /\s+$/;

			return text === null ? '' : text.toString().replace(trimLeft, '').replace(trimRight, '');
		};

	// Determines whether or not a value is a number
	var isNumber = function (value) {
		return _.isNumber(value) || (_.isString(value) && value.match(defaultPatterns.number));
	};

	// Determines whether or not not a value is empty
	var hasValue = function (value) {
		return !(_.isNull(value) || _.isUndefined(value) || (_.isString(value) && trim(value) === ''));
	};

	return {
		// Function validator
		// Lets you implement a custom function used for validation
		fn: function (value, attr, fn, fieldName, computed) {
			return fn.call(fieldName, value, attr, computed);
		},

		// Required validator
		// Validates if the attribute is required or not
		required: function (value, attr, required, fieldName, computed) {
			var isRequired = _.isFunction(required) ? required.call(model, value, attr, computed) : required;
			if (!isRequired && !hasValue(value)) {
				return false; // overrides all other validators
			}
			if (isRequired && !hasValue(value)) {
				return this.format(defaultMessages.required, fieldName);
			}
		},

		// Acceptance validator
		// Validates that something has to be accepted, e.g. terms of use
		// `true` or 'true' are valid
		acceptance: function (value, attr, accept, fieldName) {
			if (value !== 'true' && (!_.isBoolean(value) || value === false)) {
				return this.format(defaultMessages.acceptance, fieldName);
			}
		},

		// Min validator
		// Validates that the value has to be a number and equal to or greater than
		// the min value specified
		min: function (value, attr, minValue, fieldName) {
			if (!isNumber(value) || value < minValue) {
				return this.format(defaultMessages.min, fieldName, minValue);
			}
		},

		// Max validator
		// Validates that the value has to be a number and equal to or less than
		// the max value specified
		max: function (value, attr, maxValue, fieldName) {
			if (!isNumber(value) || value > maxValue) {
				return this.format(defaultMessages.max, fieldName, maxValue);
			}
		},

		// Range validator
		// Validates that the value has to be a number and equal to or between
		// the two numbers specified
		range: function (value, attr, range, fieldName) {
			if (!isNumber(value) || value < range[0] || value > range[1]) {
				return this.format(defaultMessages.range, fieldName, range[0], range[1]);
			}
		},

		// Length validator
		// Validates that the value has to be a string with length equal to
		// the length value specified
		length: function (value, attr, length, fieldName) {
			if (!hasValue(value) || trim(value).length !== length) {
				return this.format(defaultMessages.length, fieldName, length);
			}
		},

		// Min length validator
		// Validates that the value has to be a string with length equal to or greater than
		// the min length value specified
		minLength: function (value, attr, minLength, fieldName) {
			if (!hasValue(value) || trim(value).length < minLength) {
				return this.format(defaultMessages.minLength, fieldName, minLength);
			}
		},

		// Max length validator
		// Validates that the value has to be a string with length equal to or less than
		// the max length value specified
		maxLength: function (value, attr, maxLength, fieldName) {
			if (!hasValue(value) || trim(value).length > maxLength) {
				return this.format(defaultMessages.maxLength, fieldName, maxLength);
			}
		},

		// Range length validator
		// Validates that the value has to be a string and equal to or between
		// the two numbers specified
		rangeLength: function (value, attr, range, fieldName) {
			if (!hasValue(value) || trim(value).length < range[0] || trim(value).length > range[1]) {
				return this.format(defaultMessages.rangeLength, fieldName, range[0], range[1]);
			}
		},

		// One of validator
		// Validates that the value has to be equal to one of the elements in
		// the specified array. Case sensitive matching
		oneOf: function (value, attr, values, fieldName) {
			if (!_.include(values, value)) {
				return this.format(defaultMessages.oneOf, fieldName, values.join(', '));
			}
		},

		// Equal to validator
		// Validates that the value has to be equal to the value of the attribute
		// with the name specified
		equalTo: function (value, attr, equalTo, fieldName, computed) {
			if (value !== getFlat(equalTo, computed)) {
				return this.format(defaultMessages.equalTo, fieldName, this.formatLabel(equalTo, fieldName));
			}
		},

		// Pattern validator
		// Validates that the value has to match the pattern specified.
		// Can be a regular expression or the name of one of the built in patterns
		pattern: function (value, attr, pattern, fieldName) {
			if (typeof pattern === 'string') {
				var first = pattern.indexOf('/'),
					last = pattern.lastIndexOf('/');
				if (first === 0 && first !== last) {
					var r = pattern.slice(1, last),
						flags = pattern.substr(last + 1);
					pattern = new RegExp(r, flags);
				}
			}
			if (!hasValue(value) || !value.toString().match(defaultPatterns[pattern] || pattern)) {
				return this.format(defaultMessages.pattern, fieldName, pattern);
			}
		}
	};
}());


_.extend(Backbone.Events, {
  once: function(ev, callback, context) {
    var bindCallback;
    bindCallback = _.bind(function() {
      this.unbind(ev, bindCallback);
      return callback.apply(context || this, arguments);
    }, this);
    return this.bind(ev, bindCallback);
  }
});

Backbone.View.prototype.once = Backbone.Model.prototype.once = Backbone.Events.once;

Backbone.FormsEngine = {};


(function() {
  var FieldType, FieldsGroup, FormsEngine, fieldTypes;
  FormsEngine = Backbone.FormsEngine;
  FieldType = FormsEngine.FieldType = Backbone.View.extend({
    initialize: function(options) {
      var ev, rule, validation;
      this.name = (options.namePrefix ? options.namePrefix + '.' : '') + options.name;
      this.children = [];
      this.form = options.form;
      this.$el.addClass(options.type.toLowerCase() + '-field-wrapper');
      validation = options.validation;
      if (validation) {
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
          if (_this.get()) {
            return _this.validate();
          } else {
            return _this.clearValidation();
          }
        }, 10);
      };
      ev[this.changeEventName + ' ' + this.fieldTagName] = this.validate;
      ev['click .errors-block'] = this.clearValidation;
      return this.delegateEvents(ev);
    },
    changeEventName: 'change',
    fieldTagName: 'input',
    className: 'field-wrapper',
    inputType: void 0,
    template: _.template("<label for=\"<%=cid%>\" class=\"control-label\"><%-options.caption%></label>\n<div class=\"controls\">\n	<%=controlTemplate(this)%>\n</div>\n<span class=\"help-block\"><%-options.description || ''%></span>\n<span class=\"errors-block\" style=\"display: none;\"><div class=\"tip\" ></div><ul><%-options.errors || ''%></ul></span>"),
    controlTemplate: _.template("<<%-fieldTagName%> id=\"<%=cid%>\" name=\"<%=name%>\"<%=inputType ? ' type=\"' + inputType + '\"' : ''%><%=options.placeholder ? ' placeholder=\"' + options.placeholder + '\"' : ''%> tabindex=\"<%=options.tabindex%>\"></<%-fieldTagName%>"),
    validate: function() {
      var err, errors, errs;
      if (!this.form.data) {
        this.form.serialize();
      }
      errors = Validation.validate(this.name, this.get(), this.options.validation, this.form.data, this.options.caption || this.name);
      if (typeof errors === 'string') {
        errors = [errors];
      }
      if ((errors != null) && errors.length) {
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
        this.$el.addClass('invalid');
        this.hasErrors = true;
      } else if (this.hasErrors) {
        this.clearValidation();
      }
      return errors;
    },
    clearValidation: function() {
      this.$('.errors-block').hide();
      this.$el.removeClass('invalid');
      return this.hasErrors = false;
    },
    get: function() {
      return this.$("" + this.fieldTagName + "[name='" + this.name + "']").val();
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
      return this.$("" + this.fieldTagName + "[name='" + this.name + "']").prop('checked');
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
          return $(this).val();
        }).toArray();
      }
    },
    controlTemplate: _.template("<% if (fieldTagName === 'select') { %>\n	<select name=\"<%=name%>\"<%=options.multiSelect ? ' multiple' : ''%> data-max-selected=\"<%=options.maxSelected === Infinity ? undefined : options.maxSelected%>\" class=\"chzn-select\"<%=options.placeholder ? ' data-placeholder=\"' + options.placeholder + '\"' : ''%> style=\"width:350px;\" tabindex=\"<%=options.tabindex%>\">\n		<% _.each(options.items, function(item){ %>\n		<option value=\"<%-item.value !== undefined ? item.value : item%>\"><%-item.caption !== undefined ? item.caption : item.value || item%></option>\n		<% }); %>\n	</select>\n<% } else if(inputType === 'radio') { %>\n		<div class=\"group\">\n			<% _.each(options.items, function(item, i){ %>\n				<div class=\"option\">\n					<input id=\"radio_<%-cid%>_<%-i%>\" type=\"radio\" name=\"<%=name%>\" value=\"<%-item.value !== undefined ? item.value : item%>\" tabindex=\"<%=options.tabindex%>\" />\n					<label for=\"radio_<%-cid%>_<%-i%>\"><%-item.caption !== undefined ? item.caption : item.value || item%></label>\n				</div>\n				<% }); %>\n		</div>\n<% } else { %>\n		<div class=\"group\">\n			<% _.each(options.items, function(item, i){ %>\n				<div class=\"option\">\n					<input id=\"checkbox_<%-cid%>_<%-i%>\" type=\"checkbox\" name=\"<%=name%>\" value=\"<%-item.value !== undefined ? item.value : item%>\" tabindex=\"<%=options.tabindex%>\" />\n					<label for=\"checkbox_<%-cid%>_<%-i%>\"><%-item.caption !== undefined ? item.caption : item.value || item%></label>\n				</div>\n			<% }); %>\n		</div>\n<% } %>"),
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
      this.name = (options.namePrefix ? options.namePrefix + '.' : '') + options.name;
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
    template: _.template("<% if (options.caption) { %>\n	<div class=\"group-title\"><%-options.caption%></div>\n<% } %>\n<div class=\"group-items\"></div>"),
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
    events: {
      'click .remove-item-btn': 'removeItem'
    },
    template: _.template("<% if (options.caption) { %>\n	<h3 class=\"section-title\"><%-options.caption%></h3>\n<% } %>\n<div class=\"composite-fields\"></div>\n<div class=\"composite-controls\">\n	<button type=\"button\" class=\"btn remove-item-btn\"><i class=\"icon-minus\"></i> Remove</button>\n</div>"),
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
    template: _.template("<div class=\"group-title\">\n	<div class=\"title-inner\"><%-options.caption%></div>\n	<div class=\"group-controls\">\n		<button type=\"button\" class=\"btn add-item-btn\"><i class=\"icon-plus\"></i> Add</button>\n		<span class=\"title-status\"><%= titleStatusTemplate(this) %></span>\n		</div>\n</div>\n<div class=\"group-items\"></div>"),
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


(function() {
  var FormView, FormsEngine, buildFields, generateField;
  FormsEngine = Backbone.FormsEngine;
  FormView = Backbone.View.extend({
    initialize: function() {
      this.tabindex = 0;
      this.children = [];
      return this.on('ready', function() {
        return this.ready = true;
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
      errors = this.validate();
      if (errors && (errors.length > 1 || errors[0])) {
        if ((typeof console !== "undefined" && console !== null ? console.log : void 0) != null) {
          console.log('INVALID, Errors:');
          return console.log(errors);
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
  generateField = function(options, tabIdx, namePrefix, form) {
    var View;
    View = FormsEngine.fieldTypes[options.type];
    options.tabindex = 0;
    options.namePrefix = namePrefix;
    options.form = form;
    if (View) {
      return (new View(options)).render();
    }
    return null;
  };
  buildFields = FormsEngine.buildFields = function(schema, parent, namePrefix) {
    var fields, i, v, view;
    fields = (function() {
      var _results;
      _results = [];
      for (i in schema) {
        v = schema[i];
        view = generateField(v, i + 1, namePrefix, parent.form || parent);
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
    form = new FormView(this.options).render();
    form.$el.appendTo(options.target);
    buildFields(options.schema, form);
    return form;
  };
})();

})();