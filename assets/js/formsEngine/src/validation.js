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
