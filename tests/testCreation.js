"use strict";

var Lumina = require("../index");

function testableHandler(test) {
    return function(req, res, next) { // eslint-disable-line no-unused-vars
        test.done();
    };
}

var request = {
    headers: {"a": 1, "b": 2},
    body: {"c": 3, "d": 4},
    query: {"e": 5, "f": 6}
};

function testLuminaMethodSuccess(successParam, luminaMethod) {
    return function(test) {
        test.expect(0);
        var lumina = new Lumina();
        lumina.use("paramer", luminaMethod);
        var handler = lumina.illuminate({
            paramer: successParam,
            handler: testableHandler(test)
        });
        handler(request, null, null);
    };
}

function testLuminaMethodFailure(successParam, luminaMethod) {
    return function(test) {
        test.expect(1);
        var lumina = new Lumina();
        lumina.use("paramer", luminaMethod);
        test.throws(function() {
            lumina.illuminate({
                paramer: successParam,
                handler: testableHandler(test)
            });
        });
        test.done();
    };
}

function booleanLuminaMethod(shouldWhatever) {
    return function(req, res, next, pass) {
        if ( shouldWhatever === true ) {
            return pass();
        }
        else {
            return pass();
        }
    };
}

module.exports = {
    "Required Headers Creation Success": testLuminaMethodSuccess([], Lumina.requiredHeaderValidator()),
    "Required Headers Creation Failure": testLuminaMethodFailure("string", Lumina.requiredHeaderValidator()),
    "Required Body Fields Creation Success": testLuminaMethodSuccess([], Lumina.requiredBodyFieldValidator()),
    "Required Body Fields Creation Failure": testLuminaMethodFailure("string", Lumina.requiredBodyFieldValidator()),
    "Restricted Body Fields Creation Success": testLuminaMethodSuccess([], Lumina.restrictedBodyFieldValidator()),
    "Restricted Body Fields Creation Failure": testLuminaMethodFailure("string", Lumina.restrictedBodyFieldValidator()),
    "Permitted Body Fields Creation Success": testLuminaMethodSuccess(["c", "d"], Lumina.permittedBodyFieldValidator()),
    "Permitted Body Fields Creation Failure": testLuminaMethodFailure("string", Lumina.permittedBodyFieldValidator()),
    "Boolean-based Method Truthy Creation Success": testLuminaMethodSuccess(true, booleanLuminaMethod),
    "Boolean-based Method Falsey Creation Success": testLuminaMethodSuccess(false, booleanLuminaMethod),
    "Extra Lumina Conditions": function(test) {
        test.expect(1);
        var lumina = new Lumina();
        lumina.use("paramer", function(params) { // eslint-disable-line no-unused-vars
            return function(req, res, next, pass) {
                return pass();
            };
        });
        test.throws(function() {
            lumina.illuminate({
                paramer: "abc",
                failer: "def",
                handler: testableHandler(test)
            });
        });
        test.done();
    },
    "Different Handler Name": function(test) {
        test.expect(0);
        var lumina = new Lumina("gogogo");
        var handler = lumina.illuminate({
            gogogo: testableHandler(test)
        });
        handler(request, null, null);
    }
};
