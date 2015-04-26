/**
	@file Restify request validator class.
*/
"use strict";

var restify = require("restify");

/**
	@function RestifyValidatorMethod
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
	@property validator {RestifyValidatorMethod} Method used to validate the 
		request that's coming in. 
*/
var RequestValidator = function(name, validator) {
	this.name = name;
	this.validator = validator;
}

/**
	Takes care of building up the Restify-recognizable methods using any additional
	logic that developers want to use so that their actual handler code can be 
	short and sweet. 

	@property handlerName {String} The name of the property that will be used to
		execute the final Restify handler after all validation has passed.
	@property validators {RequestValidator[]} Array of all validator that have been
		prepared for use.
*/
var RestifyValidator = function(handlerName)
{
	if ( typeof handlerName !== "string" && handlerName instanceof String ) {
		throw new Error("Must create validator with client handler name.");
	}

	this.handlerName = handlerName;
	this.validators = [];
}

RestifyValidator.requiredBodyFieldValidator = function() {
	return function(fields) {
		if ( !(fields instanceof Array) ) {
			throw new Error("Required body fields must be an array");
		}

		return function(req, res, next, pass) {
			var bodyFields = Object.keys(req.body);
			var missingFields = fields.filter(function(a) {
				return bodyFields.indexOf(a) == -1;
			});
			if ( missingFields.length ) {
				return next(new restify.ForbiddenError("Must send fields: (" + missingFields + ")"));
			}
			return pass();
		}
	}
}

RestifyValidator.restrictedBodyFieldValidator = function() {
	return function(fields) {
		if ( !(fields instanceof Array) ) {
			throw new Error("Restricted body fields must be an array");
		}

		return function(req, res, next, pass) {
			var bodyFields = Object.keys(req.body);
			var naughtyFields = fields.filter(function(a) {
				return bodyFields.indexOf(a) != -1;
			});
			if ( naughtyFields.length ) {
				return next(new restify.ForbiddenError("Cannot send fields: (" + naughtyFields + ")"));
			}
			return pass();
		}
	}
}

RestifyValidator.prototype.use = function(name, validator)
{
	this.validators.push(new RequestValidator(name, validator));
}

RestifyValidator.prototype.validate = function(handlerContainer)
{
	var self = this;

	var clientHandler = handlerContainer[self.handlerName];

	// Iterate over all validators, incrementally adding them to the terminal
	// handler's chain.
	for ( var i = self.validators.length - 1; i >= 0; --i ) {
		var handler = self.validators[i];
		var handlerParams = handlerContainer[handler.name];
		if ( handlerParams ) {
			clientHandler = self._wrapMethodWithHandler(clientHandler, handlerParams, handler.validator);
		}
	}

	return clientHandler;
}

RestifyValidator.prototype._wrapMethodWithHandler = function(clientMethod, handlerParams, handler)
{
	return function(req, res, next) {
		function pass() {
			clientMethod(req, res, next);
		}
		var paramedHandler = handler(handlerParams);
		paramedHandler(req, res, next, pass);
	}
}

module.exports = RestifyValidator;
