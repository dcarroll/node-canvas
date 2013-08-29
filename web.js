var app, async, auth_required, crypto, dd, express, log, stdweb;

async = require("async");
crypto = require("crypto");
dd = require("./lib/dd");
express = require("express");
log = require("./lib/logger").init("service.web");
stdweb = require("./lib/stdweb");
app = stdweb("mc-service");
var querystring = require("querystring");

app.use(express.cookieSession({
  secret: process.env.SESSION_SECRET || "e3dka"
}));

app.use(express["static"]("" + __dirname + "/public"));

app.use(function(req, res, next) {
/*  res.locals.navigation = function(name, path) {
    var klass;
    klass = req.path === path ? "active" : "";
    return "<li class=\"" + klass + "\"><a href=\"" + path + "\">" + name + "</a></li>";
  };
  res.locals.outputs = function(model) {
    return dd.keys(model.outputs).join(",");
  };
  res.locals.inputs = function(model) {
    return dd.keys(model.inputs).join(",");
  };
  */
  res.locals.salesforce = req.session.salesforce;
  return next();
});

app.use(app.router);

app.locals.pretty = true;

app.get("/", function(req, res) {
  return res.redirect("/signed-request");
});

app.get("/signed-request", function(req, res) {
  var sr = JSON.stringify(res.locals.salesforce);
  return res.render("signed-request.ejs", { locals: { signedRequestJson: sr }});
});

app.post("/canvas", function(req, res) {
  return log.start("canvas.login", function(log) {
    var check, encoded_envelope, envelope, signature, _ref;
    _ref = req.body.signed_request.split("."), signature = _ref[0], encoded_envelope = _ref[1];
    check = crypto.createHmac("sha256", process.env.CANVAS_SECRET).update(encoded_envelope).digest("base64");
    if (check === signature) {
      envelope = JSON.parse(new Buffer(encoded_envelope, "base64").toString("ascii"));
      req.session.salesforce = envelope;
      res.redirect("/signed-request");
      return log.success({
        user: envelope.context.user.userName
      });
    } else {
      res.send("invalid", 403);
      return log.failure();
    }
  });
});

log.start("listen", function(log) {
  port = process.env.PORT || "8001";
  return app.start(port, function() {
    console.log(port);
    return log.success({
      port: port
    });
  });
});
