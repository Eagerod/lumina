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

server.get('/validation/none', lumen.illuminate({
	handler : defaultHandler
}));

server.put("/validation/body", lumen.illuminate({
	requiredBodyFields : ["a", "b"],
	restrictedBodyFields : ["d", "e"],
	handler : defaultHandler
}));

server.put("/validation/onlybody", lumen.illuminate({
	permittedBodyFields : ["a", "b"],
	handler : defaultHandler
}));

server.put("/validation/headers", lumen.illuminate({
	requiredHeaders : ["x-application-key", "x-client-id"],
	handler : defaultHandler
}));

module.exports = server;
