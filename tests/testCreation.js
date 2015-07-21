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

module.exports = {
    testRequiredHeadersCreationSuccess: testLuminaMethodSuccess([], Lumina.requiredHeaderValidator()),
    testRequiredHeadersCreationFailure: testLuminaMethodFailure("string", Lumina.requiredHeaderValidator()),
    testRequiredBodyFieldsCreationSuccess: testLuminaMethodSuccess([], Lumina.requiredBodyFieldValidator()),
    testRequiredBodyFieldsCreationFailure: testLuminaMethodFailure("string", Lumina.requiredBodyFieldValidator()),
    testRestrictedBodyFieldsCreationSuccess: testLuminaMethodSuccess([], Lumina.restrictedBodyFieldValidator()),
    testRestrictedBodyFieldsCreationFailure: testLuminaMethodFailure("string", Lumina.restrictedBodyFieldValidator()),
    testPermittedBodyFieldsCreationSuccess: testLuminaMethodSuccess(["c", "d"], Lumina.permittedBodyFieldValidator()),
    testPermittedBodyFieldsCreationFailure: testLuminaMethodFailure("string", Lumina.permittedBodyFieldValidator()),
    testExtraLuminaConditions: function(test) {
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
    testDifferentHandlerName: function(test) {
        test.expect(0);
        var lumina = new Lumina("gogogo");
        var handler = lumina.illuminate({
            gogogo: testableHandler(test)
        });
        handler(request, null, null);
    }
};
