"use strict";

var restify = require("restify");
var express = require("express");

var Lumina = require("../index");

var restifyServer = restify.createServer({
    name: "Restify-Validate Server",
    version: "1.0.0"
});

restifyServer.use(restify.bodyParser());

var expressServer = express();

expressServer.use(require("body-parser").json());

var lumen = new Lumina();
lumen.use("requiredHeaders", Lumina.requiredHeaderValidator());
lumen.use("requiredBodyFields", Lumina.requiredBodyFieldValidator());
lumen.use("restrictedBodyFields", Lumina.restrictedBodyFieldValidator());
lumen.use("permittedBodyFields", Lumina.permittedBodyFieldValidator());

function defaultHandler(req, res, next) {
    res.status(200);
    res.write("");
    res.end();
    return next();
}

var routes = [{
    method: "get",
    path: "/validation/none"
}, {
    method: "put",
    path: "/validation/body/required",
    requiredBodyFields: ["a", "b"]
}, {
    method: "put",
    path: "/validation/body/restricted",
    restrictedBodyFields: ["d", "e"]
}, {
    method: "put",
    path: "/validation/body/permitted",
    permittedBodyFields: ["a", "b"]
}, {
    method: "put",
    path: "/validation/headers/required",
    requiredHeaders: ["x-application-key", "x-client-id"]
}];

function makeServer(server) {
    for ( var i = 0; i < routes.length; ++i ) {
        var d = JSON.parse(JSON.stringify(routes[i]));
        var m = d.method;
        var r = d.path;
        delete d.method;
        delete d.path;
        d.handler = defaultHandler;
        server[m](r, lumen.illuminate(d));
    }
    return server;
}

module.exports.restify = makeServer(restifyServer);
module.exports.express = makeServer(expressServer);
