"use strict";

var restify = require("restify");

var serverSetup = require("./configureServer");

var server = restify.createServer({
    name: "Restify-Validate Server",
    version: "1.0.0"
});

server.use(restify.bodyParser());

serverSetup(server);

module.exports = require("./luminaConfig");

module.exports.setUp = function(done) {
    server.listen(8080, done);
};

module.exports.tearDown = function(done) {
    server.close(done);
};
