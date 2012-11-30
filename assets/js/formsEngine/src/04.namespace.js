
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
