/*

  ▲ asimov.js logger class

  allows logging and manipulation of buffer collection
  cannot be instance of Base, because of circular dependencies

*/

define([

  'colors',
  'lodash',
  '../core/Klass',
  './LogBuffer'

], function (colors, _, Klass, LogBuffer) {

  function censor(censor) {
    var i = 0;

    return function(key, value) {
      if(i !== 0 && typeof(censor) === 'object' && typeof(value) == 'object' && censor == value)
        return '[Circular]';

      if(i >= 29) // seems to be a harded maximum of 30 serialized objects?
        return '[Unknown]';

      ++i; // so we know we aren't using the original object anymore

      return value;
    };
  }

  var start;
  var _super = Klass.prototype;

  return Klass.extend({

    'buffer': [],

    'numericToken': '0',
    'timeToken': '%time%',

    'color': 'grey',

    'clearCommand': '\033[2J\033[0f',

    'initialize': function () {

      var self = this;
      _super.initialize.apply(self, arguments);

      self.flush = _.debounce(self.flush, 1);
    },

    'log': function (message) {

      var self = this;

      // message = message.replace('node_modules/', '');

      self.buffer.push(new LogBuffer({
        'logger': self,
        'message': message
      }));

      var buffer = self.buffer[self.buffer.length - 1];
      message = buffer.meta.message;

      if (!process.env.LEGACY_RENDER) {
        message = message[self.color];
      }

      console.log(message);
    },

    'clear': function () {

      var self = this;
      console.log(self.clearCommand);
    },

    'logClear': function (message) {

      var self = this;
      message = self.clearCommand + '\n' + message;
      return self.log(message);
    },

    'flush': function () {

      var self = this;
      var output = '';

      _.each(self.buffer, function (buffer) {
        output += buffer.meta.message.replace(self.timeToken, '') + '\n';
      });

      console.log(self.clearCommand + '\n' + output[self.color]);
    },

    'startTimer': function () {

      start = (new Date()).valueOf();
    },

    'header': function (message) {

      message = '# ' + message;

      if (this.lastWasInfo) {
        message = '\n' + message;
      }

      this.log(message.bold + '\n');
      this.lastWasInfo = false;
    },

    'json': function (obj) {

      var string = JSON.stringify(obj, censor(obj));
      this.info('debug', string, false);
    },

    'wait': function (namespace, message, showTime) {

      var self = this;

      if (!namespace || !message) {
        throw new Error('Cannot log waiting message without namespace or message');
      }

      self.info(namespace, message, false, '>');
      self.lastWasInfo = true;

      var buffer = self.buffer[self.buffer.length - 1];

      if (showTime !== false) {
        buffer.addTime();
      }

      return buffer;
    },

    'update': function (buffer) {

      var self = this;
      var timeToken = self.timeToken;

      _.each(self.buffer, function (chunk, index) {

        if (chunk.id === buffer.id) {

          if (chunk.meta.message.indexOf(timeToken) >= 0) {

            var time = self.getTime(buffer.meta.time);
            chunk.meta.message = chunk.meta.message.replace(timeToken, time);
          }

          self.buffer[index] = chunk;
        }
      });

      self.flush();
    },

    'remove': function (buffer) {

      var self = this;
      self.buffer = _.without(self.buffer, buffer);

      self.flush();
    },

    'getTime': function (timestamp) {

      var now = (new Date()).valueOf();
      var difference = now - (timestamp || start);
      var timeString = '+' + (difference/1000) + 's';
      return timeString.bold;
    },

    'info': function (namespace, message, showTime, prefix) {

      var self = this;
      var limit = 16;
      namespace = namespace.replace('Collection', '');

      if (namespace.length > limit) {
        namespace = namespace.substr(0, limit);
      }
      else {
        var length = limit - namespace.length;
        prefix = '';
        _.times(length, function () {
          prefix += ' ';
        });
      }

      if (!namespace || !message) {
        throw new Error('Cannot log waiting message without namespace or message');
      }

      var freshLine = false;

      if (self.lastNamespace && namespace !== self.lastNamespace || !self.lastNamespace) {
        freshLine = true;
      }

      self.lastNamespace = namespace;

      if (freshLine) {
        prefix = '\n' + prefix;
        namespace = namespace.toUpperCase().bold.inverse;
      }
      else {
        var arr = new Array(namespace.length + 1);
        namespace = arr.join(' ');
      }

      message = prefix + namespace + ' ' + message;

      if (showTime !== false) {
        message += ' ' + this.getTime(new Date());
      }

      this.log(message);
      this.lastWasInfo = true;

      return message;
    }
  });
});