"use strict";

var express = require("express");

var Lumina = require("../index");

var server = express();

// server.use(restify.acceptParser(server.acceptable));
// server.use(restify.queryParser());
server.use(require("body-parser").json());

var lumen = new Lumina();
lumen.use("requiredHeaders", Lumina.requiredHeaderValidator());
lumen.use("requiredBodyFields", Lumina.requiredBodyFieldValidator());
lumen.use("restrictedBodyFields", Lumina.restrictedBodyFieldValidator());
lumen.use("permittedBodyFields", Lumina.permittedBodyFieldValidator());

function defaultHandler(req, res, next) {
    res.send("");
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

for ( var i = 0; i < routes.length; ++i ) {
    var d = routes[i];
    var m = d.method;
    var r = d.path;
    delete d.method;
    delete d.path;
    d.handler = defaultHandler;
    server[m](r, lumen.illuminate(d));
}

module.exports = server;
