var restify = require("restify");

var lumina = require("../index");

var server = restify.createServer({
    name: 'Restify-Validate Server',
    version: '1.0.0'
});

server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

var lumen = new lumina();
lumen.use("requiredHeaders", lumina.requiredHeaderValidator());
lumen.use("requiredBodyFields", lumina.requiredBodyFieldValidator());
lumen.use("restrictedBodyFields", lumina.restrictedBodyFieldValidator());
lumen.use("permittedBodyFields", lumina.permittedBodyFieldValidator());

function defaultHandler(req, res, next) {
	res.send(200);
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
}]

for ( var i = 0; i < routes.length; ++i ) {
	var d = routes[i];
	var m = d.method;
	var r = d.path;
	delete d.method
	delete d.path;
	d.handler = defaultHandler;
	server[m](r, lumen.illuminate(d));
}

module.exports = server;
