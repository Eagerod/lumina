var restify = require("restify");

var restifyvalidate = require("../index");

var server = restify.createServer({
    name: 'Restify-Validate Server',
    version: '1.0.0'
});

server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

var servervalidator = new restifyvalidate();
servervalidator.use("requiredBodyFields", restifyvalidate.requiredBodyFieldValidator());
servervalidator.use("restrictedBodyFields", restifyvalidate.restrictedBodyFieldValidator());
servervalidator.use("permittedBodyFields", restifyvalidate.permittedBodyFieldValidator());

function defaultHandler(req, res, next) {
	res.send(200);
	return next();
}

server.get('/validation/none', servervalidator.validate({
	handler : defaultHandler
}));

server.put("/validation/body", servervalidator.validate({
	requiredBodyFields : ["a", "b"],
	restrictedBodyFields : ["d", "e"],
	handler : defaultHandler
}));

server.put("/validation/onlybody", servervalidator.validate({
	permittedBodyFields : ["a", "b"],
	handler : defaultHandler
}));

module.exports = server;
