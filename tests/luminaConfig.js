"use strict";

var request = require("request");

function testRoute(test, route, method, json, headers, expectStatusCode, expectBody) {
    var testCount = (2 + (expectBody != null ? 2 : 0));
    test.expect(testCount);
    request({uri: "http://localhost:8080/validation" + route, method: method, json: json, headers: headers}, function(err, resp, body) {
        if ( typeof body === "string" && body.length > 0 ) { // Request is a finicky package.
            body = JSON.parse(body);
        }
        test.ifError(err);
        test.equal(resp.statusCode, expectStatusCode);
        if ( expectBody ) {
            test.ok(body);
            test.deepEqual(body, expectBody);
        }
        test.done();
    });
}

function makeTest(route, method, json, headers, expectStatusCode, expectBody) {
    return function(test) {
        testRoute(test, route, method, json, headers, expectStatusCode, expectBody);
    };
}

module.exports = {
    "No Validation": makeTest("/none", "GET", null, null, 200),
    "Required Body Fields": {
        "Success": makeTest("/body/required", "PUT", { "a": 1, "b": 2, "c": 3}, null, 200),
        "Failure": makeTest("/body/required", "PUT", { "a": 1, "c": 3}, null, 403, { code: "ForbiddenError", message: "Must send fields: (b)" }),
        "No Body": makeTest("/body/required", "PUT", null, null, 403, { code: "ForbiddenError", message: "Must send fields: (a,b)" })
    },
    "Restricted Body Fields": {
        "Success": makeTest("/body/restricted", "PUT", { "a": 1, "b": 2}, null, 200),
        "Failure": makeTest("/body/restricted", "PUT", { "a": 1, "b": 2, "d": 4}, null, 403, { code: "ForbiddenError", message: "Cannot send fields: (d)" }),
        "No Body": makeTest("/body/restricted", "PUT", null, null, 200)
    },
    "Permitted Body Fields": {
        "Success": makeTest("/body/permitted", "PUT", { "a": 1, "b": 2}, null, 200),
        "Failure": makeTest("/body/permitted", "PUT", { "a": 1, "b": 2, "f": 6, "g": 7}, null, 403, { code: "ForbiddenError", message: "Cannot send fields: (f,g)" }),
        "No Body": makeTest("/body/permitted", "PUT", null, null, 200)
    },
    "Required Header Fields": {
        "Success": makeTest("/headers/required", "PUT", null, { "x-application-key": 1, "x-client-id": 2 }, 200),
        "Success (Case Insensitive)": makeTest("/headers/required", "PUT", null, { "X-Application-Key": 1, "X-Client-Id": 2 }, 200),
        "Failure": makeTest("/headers/required", "PUT", null, { "x-application-key": 1 }, 403, { code: "ForbiddenError", message: "Must send headers: (x-client-id)" }),
        "No Headers": makeTest("/headers/required", "PUT", null, null, 403, { code: "ForbiddenError", message: "Must send headers: (x-application-key,x-client-id)" })
    }
};
