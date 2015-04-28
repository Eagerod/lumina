# restify-validate

restify-validate is a package designed to let you create custom route-by-route 
validation methods for your Restify server. 
Validation methods are added to a middleware manager that allows you to select
which routes have which validation methods executed on them.

## Usage

Start out by installing restify-validate using npm:

    npm intall restify-validate

Set up your Restify server to use the restify-validate:

```javascript
var rv = require("restify-validate");

var validate = new rv("handler");

validate.use("requiredBodyFields", rv.requiredBodyFieldValidator());
validate.use("requiresAuthentication", function(forceAuth) {
	return function(req, res, next, pass) {
		if ( forceAuth == false ) {
			return pass();
		}
		if ( req.authorization.credentials == "valid auth token" ) {
			return pass();
		}
		return next(new restify.UnauthorizedError("You aren't authorized to access this resource"));
	}
});
```

Then set up your routes to take advantage of the validators that are set up.

```javascript
server.post("/models", validate.validate({
	requiredBodyFields : ["fieldA", "fieldB"],
	handler : function(req, res, next) {
		Model.create({a : req.body.fieldA, b : req.body.fieldB}, function() {
			res.send(201);
			return next();
		});
	}
}));

server.get("/models/:modelId", validate.validate({
	requiresAuthentication : true,
	handler : function(req, res, next) {
		Model.fetch(req.params.modelId, function(model) {
			res.send(200, model);
			return next();
		});
	}
}))
```

### Features

Gives you an easy way to keep your validation code out of your ordinary application code.
Can be extended to execute any common validation or request manipulation code in your routes.
