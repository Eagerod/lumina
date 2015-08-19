"use strict";

var request = require("request");
var async = require("async");
var express = require("./testExpress");
var restify = require("./testServer");

function testRoute(test, route, method, json, headers, expectStatusCode, expectBody) {
    var testCount = (2 + (expectBody != null ? 2 : 0)) * 2;
    test.expect(testCount);
    async.each(["8080", "8081"], function(port, cb) {
        request({uri: "http://localhost:" + port + "/validation" + route, method: method, json: json, headers: headers}, function(err, resp, body) {
            if ( typeof body === "string" && body.length > 0 ) { // Request is a finicky package.
                body = JSON.parse(body);
            }
            test.ifError(err);
            test.equal(resp.statusCode, expectStatusCode);
            if ( expectBody ) {
                test.ok(body);
                test.deepEqual(body, expectBody);
            }
            cb();
        });
    }, function() {
        test.done();
    });
}

function makeTest(route, method, json, headers, expectStatusCode, expectBody) {
    return function(test) {
        testRoute(test, route, method, json, headers, expectStatusCode, expectBody);
    };
}

module.exports = {
    behavioralTests: {
        setUp: function(done) {
            var self = this;
            restify.listen(8080, function() {
                self.express = express.listen(8081, done);
            });
        },
        tearDown: function(done) {
            var self = this;
            restify.close(function() {
                self.express.close(done);
            });
        },
        testNoValidation: makeTest("/none", "GET", null, null, 200),
        testRequiredBodyFieldValidation: {
            testSuccess: makeTest("/body/required", "PUT", { "a": 1, "b": 2, "c": 3}, null, 200),
            testFailure: makeTest("/body/required", "PUT", { "a": 1, "c": 3}, null, 403, { code: "ForbiddenError", message: "Must send fields: (b)" }),
            testNoBody: makeTest("/body/required", "PUT", null, null, 403, { code: "ForbiddenError", message: "Must send fields: (a,b)" })
        },
        testRestrictedBodyFieldValidation: {
            testSuccess: makeTest("/body/restricted", "PUT", { "a": 1, "b": 2}, null, 200),
            testFailure: makeTest("/body/restricted", "PUT", { "a": 1, "b": 2, "d": 4}, null, 403, { code: "ForbiddenError", message: "Cannot send fields: (d)" }),
            testNoBody: makeTest("/body/restricted", "PUT", null, null, 200)
        },
        testPermittedBodyFieldValidation: {
            testSuccess: makeTest("/body/permitted", "PUT", { "a": 1, "b": 2}, null, 200),
            testFailure: makeTest("/body/permitted", "PUT", { "a": 1, "b": 2, "f": 6, "g": 7}, null, 403, { code: "ForbiddenError", message: "Cannot send fields: (f,g)" }),
            testNoBody: makeTest("/body/permitted", "PUT", null, null, 200)
        },
        testHeaderValidation: {
            testSuccess: makeTest("/headers/required", "PUT", null, { "x-application-key": 1, "x-client-id": 2 }, 200),
            testSuccessCaseInsensitive: makeTest("/headers/required", "PUT", null, { "X-Application-Key": 1, "X-Client-Id": 2 }, 200),
            testFailure: makeTest("/headers/required", "PUT", null, { "x-application-key": 1 }, 403, { code: "ForbiddenError", message: "Must send headers: (x-client-id)" }),
            testNoHeaders: makeTest("/headers/required", "PUT", null, null, 403, { code: "ForbiddenError", message: "Must send headers: (x-application-key,x-client-id)" })
        }
    },
    creationTests: require("./testCreation")
};
