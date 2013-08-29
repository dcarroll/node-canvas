module.exports = {
  arrayify: function(obj) {
    if (Array.isArray(obj)) {
      return obj;
    } else {
      return [obj];
    }
  },
  delay: function(ms, cb) {
    return setTimeout(cb, ms);
  },
  every: function(ms, cb) {
    return setInterval(cb, ms);
  },
  firstkey: function(obj) {
    return obj[this.keys(obj)[0]];
  },
  keys: function(hash) {
    var key, val, _results;
    _results = [];
    for (key in hash) {
      val = hash[key];
      _results.push(key);
    }
    return _results;
  },
  //merge: coffee.helpers.merge,
  now: function() {
    return (new Date()).getTime();
  },
  random: function(digits) {
    if (digits == null) {
      digits = 1;
    }
    return Math.random().toString().slice(2, digits + 2);
  },
  reduce: function(obj, start, cb) {
    return obj.reduce(cb, start);
  },
  values: function(hash) {
    var key, val, _results;
    _results = [];
    for (key in hash) {
      val = hash[key];
      _results.push(val);
    }
    return _results;
  }
};
