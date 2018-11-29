!function(e){function n(){}function t(e,n){return function(){e.apply(n,arguments)}}function o(e){if("object"!=typeof this)throw new TypeError("Promises must be constructed via new");if("function"!=typeof e)throw new TypeError("not a function");this._state=0,this._handled=!1,this._value=void 0,this._deferreds=[],s(e,this)}function i(e,n){for(;3===e._state;)e=e._value;return 0===e._state?void e._deferreds.push(n):(e._handled=!0,void o._immediateFn(function(){var t=1===e._state?n.onFulfilled:n.onRejected;if(null===t)return void(1===e._state?r:u)(n.promise,e._value);var o;try{o=t(e._value)}catch(i){return void u(n.promise,i)}r(n.promise,o)}))}function r(e,n){try{if(n===e)throw new TypeError("A promise cannot be resolved with itself.");if(n&&("object"==typeof n||"function"==typeof n)){var i=n.then;if(n instanceof o)return e._state=3,e._value=n,void f(e);if("function"==typeof i)return void s(t(i,n),e)}e._state=1,e._value=n,f(e)}catch(r){u(e,r)}}function u(e,n){e._state=2,e._value=n,f(e)}function f(e){2===e._state&&0===e._deferreds.length&&o._immediateFn(function(){e._handled||o._unhandledRejectionFn(e._value)});for(var n=0,t=e._deferreds.length;n<t;n++)i(e,e._deferreds[n]);e._deferreds=null}function c(e,n,t){this.onFulfilled="function"==typeof e?e:null,this.onRejected="function"==typeof n?n:null,this.promise=t}function s(e,n){var t=!1;try{e(function(e){t||(t=!0,r(n,e))},function(e){t||(t=!0,u(n,e))})}catch(o){if(t)return;t=!0,u(n,o)}}var a=setTimeout;o.prototype["catch"]=function(e){return this.then(null,e)},o.prototype.then=function(e,t){var o=new this.constructor(n);return i(this,new c(e,t,o)),o},o.all=function(e){var n=Array.prototype.slice.call(e);return new o(function(e,t){function o(r,u){try{if(u&&("object"==typeof u||"function"==typeof u)){var f=u.then;if("function"==typeof f)return void f.call(u,function(e){o(r,e)},t)}n[r]=u,0===--i&&e(n)}catch(c){t(c)}}if(0===n.length)return e([]);for(var i=n.length,r=0;r<n.length;r++)o(r,n[r])})},o.resolve=function(e){return e&&"object"==typeof e&&e.constructor===o?e:new o(function(n){n(e)})},o.reject=function(e){return new o(function(n,t){t(e)})},o.race=function(e){return new o(function(n,t){for(var o=0,i=e.length;o<i;o++)e[o].then(n,t)})},o._immediateFn="function"==typeof setImmediate&&function(e){setImmediate(e)}||function(e){a(e,0)},o._unhandledRejectionFn=function(e){"undefined"!=typeof console&&console&&console.warn("Possible Unhandled Promise Rejection:",e)},o._setImmediateFn=function(e){o._immediateFn=e},o._setUnhandledRejectionFn=function(e){o._unhandledRejectionFn=e},"undefined"!=typeof module&&module.exports?module.exports=o:e.Promise||(e.Promise=o)}(this);
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var TOKEN_EXPIRATION_INTERVAL = 1000 * 60 * 60 * 24 * 7; // 1 week
var HEARTBEAT_INTERVAL = 1000 * 20; // 20 seconds
var SELF_HEAL_BACKOFFS = [0, 100, 500, 1000, 2000, 5000];
var WS_CLOSE_REASON_USER = 1000;
var IEX = "iex";
var CRYPTOQUOTE = "cryptoquote";
var PROVIDERS = [IEX, CRYPTOQUOTE];

var IntrinioRealtime = function () {
  function IntrinioRealtime(options) {
    var _this = this;

    _classCallCheck(this, IntrinioRealtime);

    this.options = options;
    this.token = null;
    this.websocket = null;
    this.channels = {};
    this.afterConnected = null; // Promise
    this.self_heal_backoff = SELF_HEAL_BACKOFFS.slice();
    this.self_heal_ref = null;
    this.quote_callback = null;
    this.error_callback = null;

    // Parse options
    if (!options) {
      this._throw("Need a valid options parameter");
    }

    if (!options.public_key) {
      this._throw("Need a valid public_key");
    }

    if (!PROVIDERS.includes(options.provider)) {
      this._throw("Need a valid provider");
    }

    // Establish connection
    this._connect();

    // Refresh token every week
    this.token_expiration_ref = setInterval(function () {
      _this._connect();
    }, TOKEN_EXPIRATION_INTERVAL);

    // Send heartbeat at intervals
    this.heartbeat_ref = setInterval(function () {
      _this._heartbeat();
    }, HEARTBEAT_INTERVAL);
  }

  _createClass(IntrinioRealtime, [{
    key: "_log",
    value: function _log() {
      var message = "IntrinioRealtime | ";

      for (var _len = arguments.length, parts = Array(_len), _key = 0; _key < _len; _key++) {
        parts[_key] = arguments[_key];
      }

      parts.forEach(function (part) {
        if ((typeof part === "undefined" ? "undefined" : _typeof(part)) === 'object') {
          part = JSON.stringify(part);
        }
        message += part;
      });
      console.log(message);
    }
  }, {
    key: "_debug",
    value: function _debug() {
      if (this.options.debug) {
        this._log.apply(this, arguments);
      }
    }
  }, {
    key: "_throw",
    value: function _throw(e) {
      var handled = false;
      if (typeof e === 'string') {
        e = "IntrinioRealtime | " + e;
      }
      if (typeof this.error_callback === 'function') {
        this.error_callback(e);
        handled = true;
      }
      if (!handled) {
        throw e;
      }
    }
  }, {
    key: "_connect",
    value: function _connect() {
      var _this2 = this;

      var rejoin = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      this._debug("Connecting...");

      this.afterConnected = new Promise(function (fulfill, reject) {
        _this2._refreshToken().then(function () {
          _this2._refreshWebsocket().then(function () {
            fulfill();
          }, reject);
        }, reject);
      });

      this.afterConnected.then(function () {
        _this2._stopSelfHeal();
        if (rejoin) {
          _this2._rejoinChannels();
        }
      }, function () {
        _this2._trySelfHeal();
      });

      return this.afterConnected;
    }
  }, {
    key: "_refreshToken",
    value: function _refreshToken() {
      var _this3 = this;

      this._debug("Requesting auth token...");

      return new Promise(function (fulfill, reject) {
        var _options = _this3.options,
            public_key = _options.public_key,
            provider = _options.provider;

        // Get token

        var url = "";
        if (provider == "iex") {
          url = "https://realtime.intrinio.com/auth";
        } else if (provider == "cryptoquote") {
          url = "https://crypto.intrinio.com/auth";
        }

        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function () {
          if (xmlhttp.readyState == 4) {
            if (xmlhttp.status == 401) {
              _this3._throw("Unable to authorize");
              reject();
            } else if (xmlhttp.status != 200) {
              console.error("IntrinioRealtime | Could not get auth token: Status code " + xmlhttp.status);
              console.error(xmlhttp);
              reject();
            } else {
              _this3.token = xmlhttp.responseText;
              _this3._debug("Received auth token!");
              fulfill();
            }
          }
        };
        xmlhttp.open("GET", url, true);
        xmlhttp.setRequestHeader('Content-Type', 'application/json');
        xmlhttp.setRequestHeader('Authorization', 'Public ' + public_key);
        xmlhttp.send();
      });
    }
  }, {
    key: "_refreshWebsocket",
    value: function _refreshWebsocket() {
      var _this4 = this;

      this._debug("Establishing websocket...");

      return new Promise(function (fulfill, reject) {
        if (_this4.websocket) {
          _this4.websocket.close(WS_CLOSE_REASON_USER, "User terminated");
        }

        var socket_url = "";

        if (_this4.options.provider == "iex") {
          socket_url = "wss://realtime.intrinio.com/socket/websocket?vsn=1.0.0&token=" + encodeURIComponent(_this4.token);
        } else if (_this4.options.provider == "cryptoquote") {
          socket_url = "wss://crypto.intrinio.com/socket/websocket?vsn=1.0.0&token=" + encodeURIComponent(_this4.token);
        }

        _this4.websocket = new WebSocket(socket_url);

        _this4.websocket.onopen = function () {
          _this4._debug("Websocket connected!");
          fulfill();
        };

        _this4.websocket.onclose = function (code, reason) {
          _this4._debug("Websocket closed!");
          if (code != WS_CLOSE_REASON_USER) {
            _this4._trySelfHeal();
          }
        };

        _this4.websocket.onerror = function (e) {
          console.error("IntrinioRealtime | Websocket error: " + e + "\n" + e.stack.split("\n"));
          reject(e);
        };

        _this4.websocket.onmessage = function (event) {
          var message = JSON.parse(event.data);
          var quote = null;

          if (_this4.options.provider == "iex") {
            if (message["event"] === 'quote') {
              quote = message["payload"];
            }
          } else if (_this4.options.provider == "cryptoquote") {
            if (message["event"] === 'book_update' || message["event"] === 'ticker' || message["event"] === 'trade') {
              quote = message["payload"];
            }
          }

          if (quote) {
            if (typeof _this4.quote_callback === 'function') {
              _this4.quote_callback(quote);
            }
            _this4._debug('Quote: ', quote);
          } else {
            _this4._debug('Non-quote message: ', event);
          }
        };
      });
    }
  }, {
    key: "_trySelfHeal",
    value: function _trySelfHeal() {
      var _this5 = this;

      this._log("No connection! Retrying...");

      var time = this.self_heal_backoff[0];
      if (this.self_heal_backoff.length > 1) {
        time = this.self_heal_backoff.shift();
      }

      if (this.self_heal_ref) {
        clearTimeout(this.self_heal_ref);
      }

      this.self_heal_ref = setTimeout(function () {
        _this5._connect(true);
      }, time);
    }
  }, {
    key: "_stopSelfHeal",
    value: function _stopSelfHeal() {
      this.self_heal_backoff = Array.from(SELF_HEAL_BACKOFFS);

      if (this.self_heal_ref) {
        clearTimeout(this.self_heal_ref);
        this.self_heal_ref = null;
      }
    }
  }, {
    key: "_rejoinChannels",
    value: function _rejoinChannels() {
      for (var channel in this.channels) {
        var msg = this._generateJoinMessage(channel);
        this.websocket.send(JSON.stringify(msg));

        this._debug('Rejoined channel: ', channel);
      }
    }
  }, {
    key: "_heartbeat",
    value: function _heartbeat() {
      var _this6 = this;

      this.afterConnected.then(function () {
        if (_this6.options.provider == "iex" || _this6.options.provider == "cryptoquote") {
          _this6.websocket.send(JSON.stringify({
            topic: 'phoenix',
            event: 'heartbeat',
            payload: {},
            ref: null
          }));
        }
      });
    }
  }, {
    key: "_parseChannels",
    value: function _parseChannels(args) {
      var _this7 = this;

      var channels = [];

      args.forEach(function (arg) {
        if (Array.isArray(arg)) {
          arg.forEach(function (sub_arg) {
            if (typeof sub_arg === 'string') {
              channels.push(sub_arg.trim());
            } else {
              _this7._throw("Invalid channel provided");
            }
          });
        } else if (typeof arg === 'string') {
          channels.push(arg.trim());
        } else {
          _this7._throw("Invalid channel provided");
        }
      });

      channels.forEach(function (channel) {
        if (channel.length == 0) {
          _this7._throw("Invalid channel provided");
        }
      });

      return channels;
    }
  }, {
    key: "_parseIexTopic",
    value: function _parseIexTopic(channel) {
      var topic = null;
      if (channel == "$lobby") {
        topic = "iex:lobby";
      } else if (channel == "$lobby_last_price") {
        topic = "iex:lobby:last_price";
      } else {
        topic = "iex:securities:" + channel;
      }
      return topic;
    }
  }, {
    key: "_generateJoinMessage",
    value: function _generateJoinMessage(channel) {
      if (this.options.provider == "iex") {
        return {
          topic: this._parseIexTopic(channel),
          event: 'phx_join',
          payload: {},
          ref: null
        };
      } else if (this.options.provider == "cryptoquote") {
        return {
          topic: channel,
          event: 'phx_join',
          payload: {},
          ref: null
        };
      }
    }
  }, {
    key: "_generateLeaveMessage",
    value: function _generateLeaveMessage(channel) {
      if (this.options.provider == "iex") {
        return {
          topic: this._parseIexTopic(channel),
          event: 'phx_leave',
          payload: {},
          ref: null
        };
      } else if (this.options.provider == "cryptoquote") {
        return {
          topic: channel,
          event: 'phx_leave',
          payload: {},
          ref: null
        };
      }
    }
  }, {
    key: "destroy",
    value: function destroy() {
      if (this.token_expiration_ref) {
        clearInterval(this.token_expiration_ref);
      }

      if (this.heartbeat_ref) {
        clearInterval(this.heartbeat_ref);
      }

      if (this.self_heal_ref) {
        clearTimeout(this.self_heal_ref);
      }

      if (this.websocket) {
        this.websocket.close(WS_CLOSE_REASON_USER, "User terminated");
      }
    }
  }, {
    key: "onError",
    value: function onError(callback) {
      this.error_callback = callback;
    }
  }, {
    key: "onQuote",
    value: function onQuote(callback) {
      this.quote_callback = callback;
    }
  }, {
    key: "join",
    value: function join() {
      var _this8 = this;

      for (var _len2 = arguments.length, channels = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        channels[_key2] = arguments[_key2];
      }

      var channels = this._parseChannels(channels);

      return this.afterConnected.then(function () {
        channels.forEach(function (channel) {
          _this8.channels[channel] = true;

          var msg = _this8._generateJoinMessage(channel);
          _this8.websocket.send(JSON.stringify(msg));

          _this8._debug('Joined channel: ', channel);
        });
      });
    }
  }, {
    key: "leave",
    value: function leave() {
      var _this9 = this;

      for (var _len3 = arguments.length, channels = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        channels[_key3] = arguments[_key3];
      }

      var channels = this._parseChannels(channels);

      return this.afterConnected.then(function () {
        channels.forEach(function (channel) {
          delete _this9.channels[channel];

          var msg = _this9._generateLeaveMessage(channel);
          _this9.websocket.send(JSON.stringify(msg));

          _this9._debug('Left channel: ', channel);
        });
      });
    }
  }, {
    key: "leaveAll",
    value: function leaveAll() {
      var _this10 = this;

      return this.afterConnected.then(function () {
        for (var channel in _this10.channels) {
          delete _this10.channels[channel];

          var msg = _this10._generateLeaveMessage(channel);
          _this10.websocket.send(JSON.stringify(msg));

          _this10._debug('Left channel: ', channel);
        }
      });
    }
  }, {
    key: "listConnectedChannels",
    value: function listConnectedChannels() {
      var channels = [];
      for (var channel in this.channels) {
        channels.push(channel);
      }
      return channels;
    }
  }]);

  return IntrinioRealtime;
}();

window.IntrinioRealtime = IntrinioRealtime;
