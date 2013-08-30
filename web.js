var app, async, auth_required, crypto, dd, dc, express, log, stdweb;

async = require("async");
crypto = require("crypto");
dd = require("./lib/dd");
express = require("express");
log = require("./lib/logger").init("service.web");
stdweb = require("./lib/stdweb");
app = stdweb("mc-service");
var querystring = require("querystring");
dc = require("./lib/dc");

app.use(express.cookieSession({
  secret: process.env.SESSION_SECRET || "e3dka"
}));

app.use(express["static"]("" + __dirname + "/public"));

app.use(function(req, res, next) {
  res.locals.salesforce = req.session.salesforce;
  return next();
});

app.use(app.router);

app.locals.pretty = true;

app.get("/", function(req, res) {
  return res.redirect("/signed-request");
});

app.get("/signed-request", function(req, res) {
  var sr;
  if (typeof res.locals.salesforce === 'undefined') {
    // Need actual orgId, UserId, instance and oauth token or sessionId
    // This was not started from a canvas app, we will use a static JSON
    // object to simulate a signed request that has been verified
    console.log("Getting static request");
    sr = dc.getStaticRequest();
  } else {
    sr = JSON.stringify(res.locals.salesforce);
  }
  console.log(JSON.stringify(res.locals.salesforce, null, 4));
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
