var Stdweb, coffee, express, http, log;

express = require("express");

http = require("http");

log = require("./logger").init("banker");

Stdweb = (function() {

  function Stdweb(name) {
    this.name = name;
  }

  Stdweb.prototype.listen = function(port) {
    if (port == null) {
      port = process.env.PORT;
    }
    this.app.use(this.app.router);
    return this.app.listen(port);
  };

  return Stdweb;

})();

module.exports = function(name) {
  var app;
  app = express();
  app.server = http.createServer(app);
  app.disable("x-powered-by");
  express.logger.format("method", function(req, res) {
    return req.method.toLowerCase();
  });
  express.logger.format("url", function(req, res) {
    return req.url.replace('"', "&quot");
  });
  express.logger.format("user-agent", function(req, res) {
    return (req.headers["user-agent"] || "").replace('"', "");
  });
  app.use(express.logger({
    buffer: false,
    format: "ns=\"banker\" measure=\"http.:method\" source=\":url\" status=\":status\" elapsed=\":response-time\" from=\":remote-addr\""
  }));
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.start = function(port, cb) {
    debugger;
    if (port instanceof Function) {
      cb = port;
      port = process.env.PORT;
    }
    console.log("P1: " + port);
    return this.server.listen(port, function() {
      console.log("Port is: " + port);
      return cb(port);
    });
  };
  return app;
};
