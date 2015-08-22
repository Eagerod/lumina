# Lumina

Lumina is a package designed to let you create custom route-by-route preprocessing and validation methods for your Restify or Express server. 
Processing methods are added to a middleware manager that allows you to select which routes have which validation methods executed on them.

## Usage

Start out by installing Lumina using npm:

    npm install lumina

Set up your Restify/Express server to use Lumina:

```javascript
var lumina = require("lumina");

var lumen = new lumina();

lumen.use("requiredBodyFields", lumina.requiredBodyFieldValidator());
lumen.use("requiresAuthentication", function(forceAuth) {
    return function(req, res, next, pass) {
        if ( forceAuth === false ) {
            return pass();
        }
        if ( req.authorization.credentials === "valid auth token" ) {
            return pass();
        }
        res.status(401);
        res.send({
            code: "UnauthorizedError",
            message: "You aren't authorized to access this resource"
        });
        return next();
    };
});
```

Then set up your routes to take advantage of the validators that are set up.

```javascript
server.post("/models", lumen.illuminate({
    requiredBodyFields: ["fieldA", "fieldB"],
    handler: function(req, res, next) {
        Model.create({a: req.body.fieldA, b: req.body.fieldB}, function() {
            res.send(201);
            return next();
        });
    }
}));

server.get("/models/:modelId", lumen.illuminate({
    requiresAuthentication: true,
    handler: function(req, res, next) {
        Model.fetch(req.params.modelId, function(model) {
            res.send(200, model);
            return next();
        });
    }
}));
```

### Features

Gives you an easy way to keep your validation code out of your ordinary application code.
Can be extended to execute any common validation or request manipulation code in your routes.
