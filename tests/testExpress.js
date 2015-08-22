"use strict";

var express = require("express");
var bodyParser = require("body-parser");

var serverSetup = require("./configureServer");

var server = express();

server.use(bodyParser.json());

serverSetup(server);

module.exports = require("./luminaConfig");

module.exports.setUp = function(done) {
    this.express = server.listen(8080, done);
};

module.exports.tearDown = function(done) {
    this.express.close(done);
};
