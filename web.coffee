async   = require("async")
coffee  = require("coffee-script")
crypto  = require("crypto")
dd      = require("./lib/dd")
express = require("express")
log     = require("./lib/logger").init("service.web")
stdweb  = require("./lib/stdweb")

app = stdweb("mc-service")

app.use express.cookieSession(secret:process.env.SESSION_SECRET || "e3dka")

app.use express.static("#{__dirname}/public")
app.use (req, res, next) ->
  res.locals.navigation = (name, path) ->
    klass = if req.path is path then "active" else ""
    "<li class=\"#{klass}\"><a href=\"#{path}\">#{name}</a></li>"
  res.locals.outputs = (model) -> dd.keys(model.outputs).join(",")
  res.locals.inputs = (model) -> dd.keys(model.inputs).join(",")
  res.locals.salesforce = req.session.salesforce
  next()
app.use app.router

app.locals.pretty = true

app.get "/", (req, res) ->
  res.redirect "/stats"

app.get "/stats", (req, res) ->
  res.render "stats/index.jade"

app.get "/rules", (req, res) ->
  res.render "rules/index.jade"

app.get "/rules/new", (req, res) ->
  res.render "rules/new.jade"

app.post "/rules", (req, res) ->
  rule =
    condition:
      device: req.body["condition.device"]
      output: req.body["condition.output"]
      compare: req.body["condition.compare"]
      value: req.body["condition.value"]
    action:
      device: req.body["action.device"]
      input: req.body["action.input"]
      value: req.body["action.value"]
  if rule.action.device is "salesforce"
    rule.action.salesforce = req.session.salesforce
  store.create "rule", rule, (err) ->
    res.redirect "/rules"

app.get "/rules/:id/delete", (req, res) ->
  store.delete "rule", req.params.id, (err, rule) ->
    res.redirect "/rules"

app.get "/rules.json", (req, res) ->
  store.list "rule", (err, rules) ->
    res.json rules

app.get "/models", (req, res) ->
  res.render "models/index.jade"

app.get "/models/new", (req, res) ->
  res.render "models/new.jade"

app.post "/models", (req, res) ->
  store.create "model", dd.merge(JSON.parse(req.body.body), name:req.body.name), (err, model) ->
    res.redirect "/models"

app.get "/models/:id/edit", (req, res) ->
  store.fetch "model", req.params.id, (err, model) ->
    res.render "models/edit.jade", model:model

app.post "/models/:id", (req, res) ->
  store.fetch "model", req.params.id, (err, model) ->
    store.update "model", req.params.id, dd.merge(JSON.parse(req.body.body), name:req.body.name), (err, model) ->
      res.redirect "/models"

app.get "/models/:id/delete", (req, res) ->
  store.delete "model", req.params.id, (err, model) ->
    res.redirect "/models"

app.get "/models.json", (req, res) ->
  store.list "model", (err, models) ->
    res.json models

app.post "/canvas", (req, res) ->
  log.start "canvas.login", (log) ->

    [signature, encoded_envelope] = req.body.signed_request.split(".")
    check = crypto.createHmac("sha256", process.env.CANVAS_SECRET).update(encoded_envelope).digest("base64")
    if check is signature
      envelope = JSON.parse(new Buffer(encoded_envelope, "base64").toString("ascii"))
      req.session.salesforce = envelope
      res.redirect "/"
      log.success user:envelope.context.user.userName
    else
      res.send "invalid", 403
      log.failure()

auth_required = express.basicAuth (user, pass) ->
  if process.env.HTTP_PASSWORD then pass == process.env.HTTP_PASSWORD else true

app.get "/service/mqtt", auth_required, (req, res) ->
  res.send process.env.MQTT_URL

# socket.bind "handshake", (client) ->
#   redis.zadd "devices", (new Date()).getTime() + 5000, client

# socket.bind "disconnect", (client) ->
#   redis.zrem "devices", client



log.start "listen", (log) ->
  app.start (port) ->
    log.success port:port
