/**
	@file Restify request validator class.
*/
"use strict";

// Really only needs restify to send nicely formed errors.
var restify = require("restify");

/**
	@function RestifyHandler
	@comment (For documentation purposes only.)
	@desc A default restify handler.

	@param req {Object} A Restify request object.
	@param res {Object} A Restify response object.
	@param next {Function} Restify's next function.
*/

/**
	@function LuminaMethod
	@comment (For documentation purposes only.)
	@desc A Restify handler with an additional parameter that allows users to
		dictate when certain validations pass.

	@param req {Object} A Restify request object.
	@param res {Object} A Restify response object.
	@param next {Function} Restify's next function.
	@param pass {Function} Function called when the validator wishes to allow
		the next validator in the chain to be executed.
*/

/**
	Encapsulates a handler and a name.

	@property name {String} The name that will be used to have this validator
		execute.
	@property validator {LuminaMethod} Method used to validate the
		request that's coming in.
*/
var RequestValidator = function(name, validator) {
	this.name = name;
	this.validator = validator;
}

/**
	@class Lumina

	@classdesc Takes care of building up the Restify-recognizable methods using
	any additional logic that developers want to use so that their actual
	handler code can be short and sweet.

	@property handlerName {String} The name of the property that will be used to
		execute the final Restify handler after all validation has passed.
	@property validators {RequestValidator[]} Array of all validator that have been
		prepared for use.
*/
var Lumina = function(handlerName)
{
	if ( handlerName === undefined ) {
		this.handlerName = "handler"; // Use default.
	}
	else {
		this.handlerName = handlerName;
	}
	this.validators = [];
}

/**
	@return {LuminaMethod} A default validator that requires the presence of
		certain HTTP header fields in the request.
*/
Lumina.requiredHeaderValidator = function() {
	return function(fields) {
		if ( !(fields instanceof Array) ) {
			throw new Error("Required headers must be an array.");
		}

		// HTTP headers are lowercased by restify, so drop all of the headers to
		// lowercase to prevent silly errors.
		fields = fields.map(function(a) {
			return a.toLowerCase();
		});

		return function(req, res, next, pass) {
			var headers = Object.keys(req.headers);
			var missingFields = fields.filter(function(a) {
				return headers.indexOf(a) === -1;
			});
			if ( missingFields.length ) {
				return next(new restify.ForbiddenError("Must send headers: (" + missingFields + ")"));
			}
			return pass();
		}
	}
}

/**
	@return {LuminaMethod} A default validator that will take in an
		array of field names, and ensure that request bodies have all of those
		fields present.
*/
Lumina.requiredBodyFieldValidator = function() {
	return function(fields) {
		if ( !(fields instanceof Array) ) {
			throw new Error("Required body fields must be an array.");
		}

		return function(req, res, next, pass) {
			if ( req.body == null ) {
				return next(new restify.ForbiddenError("Must send fields: (" + fields + ")"));
			}
			var bodyFields = Object.keys(req.body);
			var missingFields = fields.filter(function(a) {
				return bodyFields.indexOf(a) === -1;
			});
			if ( missingFields.length ) {
				return next(new restify.ForbiddenError("Must send fields: (" + missingFields + ")"));
			}
			return pass();
		}
	}
}

/**
	@return {LuminaMethod} A default validator that will take in an
		array of field names, and ensure that request bodies have none of those
		fields present.
*/
Lumina.restrictedBodyFieldValidator = function() {
	return function(fields) {
		if ( !(fields instanceof Array) ) {
			throw new Error("Restricted body fields must be an array");
		}

		return function(req, res, next, pass) {
			if ( req.body == null ) {
				return pass();
			}
			var bodyFields = Object.keys(req.body);
			var naughtyFields = fields.filter(function(a) {
				return bodyFields.indexOf(a) !== -1;
			});
			if ( naughtyFields.length ) {
				return next(new restify.ForbiddenError("Cannot send fields: (" + naughtyFields + ")"));
			}
			return pass();
		}
	}
}

/**
	@return {LuminaMethod} A default validator that will take in an
		array of field names, and ensure that only fields in provided list are
		present.
*/
Lumina.permittedBodyFieldValidator = function() {
	return function(fields) {
		if ( !(fields instanceof Array) ) {
			throw new Error("Restricted body fields must be an array");
		}

		return function(req, res, next, pass) {
			if ( req.body == null ) {
				return pass();
			}
			var bodyFields = Object.keys(req.body);
			var naughtyFields = bodyFields.filter(function(a) {
				return fields.indexOf(a) === -1;
			});
			if ( naughtyFields.length ) {
				return next(new restify.ForbiddenError("Cannot send fields: (" + naughtyFields + ")"));
			}
			return pass();
		}
	}
}

/**
	Add a validator to the list of possible validators that can be used.

	@param name {String} The name of the key that is used in handlers to specify
		the presence of a particular validator.
	@param validator {LuminaMethod} A validator method that's used to
		process the contents of a request.
*/
Lumina.prototype.use = function(name, validator)
{
	this.validators.push(new RequestValidator(name, validator));
}

/**
	Apply the provided validators to the function that's provided. Handlers are
	called in the order that they were added using the <code>use</code> method.

	@throws If there are keys in the handler container that were not processed
	into executable handlers.

	@param handlerContainer {Object} An object that maps validator names to their
	respective inputs, and hosts the Restify handler under the key specified by
	<code>this.handlerName</code>
*/
Lumina.prototype.illuminate = function(handlerContainer)
{
	var self = this;

	var clientHandler = handlerContainer[self.handlerName];

	var handlersToAdd = Object.keys(handlerContainer).length - 1;

	// Iterate over all validators, incrementally adding them to the terminal
	// handler's chain.
	for ( var i = self.validators.length - 1; i >= 0; --i ) {
		var handler = self.validators[i];
		var handlerParams = handlerContainer[handler.name];
		if ( handlerParams ) {
			clientHandler = self._wrapMethodWithHandler(clientHandler, handlerParams, handler.validator);
			--handlersToAdd;
		}
	}

	// Test for extra parameters, throw a nicely formatted error.
	if ( handlersToAdd !== 0 ) {
		var keys = Object.keys(handlerContainer).filter(function(h) {
			for ( var i = 0; i < self.validators.length; ++i ) {
				if ( self.validators[i].name === h ) {
					return false;
				}
			}
			if ( h === self.handlerName ) {
				return false;
			}
			return true;
		});
		throw new Error("Unknown keys present in handlerContainer (" + keys + ")");
	}

	return clientHandler;
}

/**
	Create a function that handles sending in the pass parameter to
		{@link LuminaMethod} methods. Allows the execution chain to
		continue when the user calls `pass()`

	@param clientMethod {RestifyHandler} - The handler that contains the code
		written by the client.
	@param handlerParams {Object} - The options that the user sent in with the
		client method for the provided handler.
	@param handler {LuminaMethod} - The validator method that will be
		provided with the `handlerParam` in order to carry out the validation.
*/
Lumina.prototype._wrapMethodWithHandler = function(clientMethod, handlerParams, handler)
{
	return function(req, res, next) {
		function pass() {
			clientMethod(req, res, next);
		}
		var paramedHandler = handler(handlerParams);
		paramedHandler(req, res, next, pass);
	}
}

module.exports = Lumina;
