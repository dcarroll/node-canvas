var Logger, dd, uuid, extend;

extend = require("xtend");
dd = require("./dd");

uuid = require("node-uuid");

Logger = (function() {

  function Logger(ns, options) {
    this.ns = ns;
    this.options = options != null ? options : {x:1};
  }

  Logger.prototype.write = function(options) {
    var key, message, opts, val;
    if (options == null) {
      options = {};
    }
    opts = extend({
      ns: this.ns
    }, options);
    message = (function() {
      var _results;
      _results = [];
      for (key in opts) {
        val = opts[key];
        _results.push("" + key + "=\"" + ((val != null ? val : "").toString().replace('"', '\\"')) + "\"");
      }
      return _results;
    })();
    return console.log(message.join(" "));
  };

  Logger.prototype.write_status = function(status, options) {
    var opts;
    if (options == null) {
      options = {};
    }
    opts = extend(this.options, options);
    opts.measure = "" + opts.measure;
    opts.status = status;
    if (this.started) {
      opts.elapsed = dd.now() - this.started;
    }
    return this.write(opts);
  };

  Logger.prototype.log = function(opts, cb) {
    var logger, options;
    if (opts == null) {
      opts = {};
    }
    options = extend(this.options, opts);
    if (options.txn === true) {
      options.txn = uuid.v1().split("-")[0];
    }
    if (cb != null) {
      logger = new Logger(this.ns, options);
      logger.start = new Date().getTime();
      return cb(logger);
    } else {
      return this.write(options);
    }
  };

  Logger.prototype.finish = function(opts) {
    var elapsed, finish, options;
    if (opts == null) {
      opts = {};
    }
    options = extend(this.options, opts);
    finish = new Date().getTime();
    elapsed = finish - this.start;
    return this.write(extend(options, {
      elapsed: "" + elapsed + "ms"
    }));
  };

  Logger.prototype.start = function(measure, options, cb) {
    var logger, opts;
    if (options == null) {
      options = {};
    }
    if (options instanceof Function) {
      cb = options;
      options = {};
    }
    if (options.txn === true) {
      options.txn = uuid.v1().split("-")[0];
    }
    console.log(JSON.stringify(this.options, null, 4));
    opts = extend(this.options, options);
    opts.measure = measure;
    logger = new Logger(this.ns, opts);
    logger.started = new Date().getTime();
    logger.measure = measure;
    if (logger) {
      return cb(logger);
    }
  };

  Logger.prototype.success = function(options) {
    if (options == null) {
      options = {};
    }
    return this.write_status("success", options);
  };

  Logger.prototype.failure = function(message, options) {
    if (options == null) {
      options = {};
    }
    return this.write_status("failure", extend(options, {
      message: message
    }));
  };

  Logger.prototype.delay = function(delay, options) {
    if (options == null) {
      options = {};
    }
    return this.write_status("delay", options);
  };

  Logger.prototype.error = function(err, opts) {
    var id, idx, line, options, _ref;
    if (opts == null) {
      opts = {};
    }
    id = uuid.v1().split("-")[0];
    options = {
      id: id,
      name: err.name,
      message: err.message
    };
    options = extend(this.options, options);
    options = extend(options, opts);
    this.write_status("error", options);
    if (err.stack) {
      _ref = err.stack.split("\n");
      for (idx in _ref) {
        line = _ref[idx];
        this.write({
          at: "error",
          id: id,
          line: idx,
          trace: line
        });
      }
    }
    return err;
  };

  Logger.prototype.coerce_error = function(err) {
    var k, str, v;
    if (err instanceof Error) {
      return err;
    } else if (typeof err === "string") {
      return new Error(err);
    } else {
      str = "";
      for (k in err) {
        v = err[k];
        str += v;
      }
      return new Error(str);
    }
  };

  Logger.prototype.measure = function(name, value, options) {
    if (options == null) {
      options = {};
    }
    return this.write(extend({
      measure: name,
      value: value
    }, options));
  };

  return Logger;

})();

module.exports.init = function(ns, options) {
  if (options == null) {
    options = {};
  }
  return new Logger(ns);
};
