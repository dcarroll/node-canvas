var app, async, auth_required, crypto, dd, express, log, stdweb;

async = require("async");
crypto = require("crypto");
dd = require("./lib/dd");
express = require("express");
log = require("./lib/logger").init("service.web");
stdweb = require("./lib/stdweb");
app = stdweb("mc-service");

app.use(express.cookieSession({
  secret: process.env.SESSION_SECRET || "e3dka"
}));

app.use(express["static"]("" + __dirname + "/public"));

app.use(function(req, res, next) {
  res.locals.navigation = function(name, path) {
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
  res.locals.salesforce = req.session.salesforce;
  return next();
});

app.use(app.router);

app.locals.pretty = true;

app.get("/", function(req, res) {
  return res.redirect("/stats");
});

app.get("/stats", function(req, res) {
  return res.render("stats/index.jade");
});

app.get("/rules", function(req, res) {
  return res.render("rules/index.jade");
});

app.get("/rules/new", function(req, res) {
  return res.render("rules/new.jade");
});

app.post("/rules", function(req, res) {
  var rule;
  rule = {
    condition: {
      device: req.body["condition.device"],
      output: req.body["condition.output"],
      compare: req.body["condition.compare"],
      value: req.body["condition.value"]
    },
    action: {
      device: req.body["action.device"],
      input: req.body["action.input"],
      value: req.body["action.value"]
    }
  };
  if (rule.action.device === "salesforce") {
    rule.action.salesforce = req.session.salesforce;
  }
  return store.create("rule", rule, function(err) {
    return res.redirect("/rules");
  });
});

app.get("/rules/:id/delete", function(req, res) {
  return store["delete"]("rule", req.params.id, function(err, rule) {
    return res.redirect("/rules");
  });
});

app.get("/rules.json", function(req, res) {
  return store.list("rule", function(err, rules) {
    return res.json(rules);
  });
});

app.get("/models", function(req, res) {
  return res.render("models/index.jade");
});

app.get("/models/new", function(req, res) {
  return res.render("models/new.jade");
});

app.post("/models", function(req, res) {
  return store.create("model", dd.merge(JSON.parse(req.body.body), {
    name: req.body.name
  }), function(err, model) {
    return res.redirect("/models");
  });
});

app.get("/models/:id/edit", function(req, res) {
  return store.fetch("model", req.params.id, function(err, model) {
    return res.render("models/edit.jade", {
      model: model
    });
  });
});

app.post("/models/:id", function(req, res) {
  return store.fetch("model", req.params.id, function(err, model) {
    return store.update("model", req.params.id, dd.merge(JSON.parse(req.body.body), {
      name: req.body.name
    }), function(err, model) {
      return res.redirect("/models");
    });
  });
});

app.get("/models/:id/delete", function(req, res) {
  return store["delete"]("model", req.params.id, function(err, model) {
    return res.redirect("/models");
  });
});

app.get("/models.json", function(req, res) {
  return store.list("model", function(err, models) {
    return res.json(models);
  });
});

app.post("/canvas", function(req, res) {
  return log.start("canvas.login", function(log) {
    var check, encoded_envelope, envelope, signature, _ref;
    _ref = req.body.signed_request.split("."), signature = _ref[0], encoded_envelope = _ref[1];
    check = crypto.createHmac("sha256", process.env.CANVAS_SECRET).update(encoded_envelope).digest("base64");
    if (check === signature) {
      envelope = JSON.parse(new Buffer(encoded_envelope, "base64").toString("ascii"));
      req.session.salesforce = envelope;
      res.redirect("/");
      return log.success({
        user: envelope.context.user.userName
      });
    } else {
      res.send("invalid", 403);
      return log.failure();
    }
  });
});

auth_required = express.basicAuth(function(user, pass) {
  if (process.env.HTTP_PASSWORD) {
    return pass === process.env.HTTP_PASSWORD;
  } else {
    return true;
  }
});

app.get("/service/mqtt", auth_required, function(req, res) {
  return res.send(process.env.MQTT_URL);
});

log.start("listen", function(log) {
  return app.start(function(port) {
    return log.success({
      port: port
    });
  });
});
