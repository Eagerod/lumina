"use strict";

var request = require("request");
var server = require("./testServer");

module.exports = {
	setUp : function(done) {
		server.listen(8080, function() {
			done();
		});
	},
	tearDown : function(done) {
		server.close();
		done();
	},
	testNoValidation : function(test) {
		test.expect(1);
		request.get("http://localhost:8080/validation/none", function(err, resp, body) {
			test.equal(resp.statusCode, 200);
			test.done();
		});
	},
	testRequiredBodyFieldValidation : function(test) {
		test.expect(4);
		request({uri:"http://localhost:8080/validation/body/required", method:"PUT", json : { "a" : 1, "b" : 2, "c" : 3}}, function(err, resp, body) {
			test.equal(resp.statusCode, 200);
			request({uri:"http://localhost:8080/validation/body/required", method:"PUT"}, function(err, resp, body) {
				test.equal(resp.statusCode, 403);
				request({uri:"http://localhost:8080/validation/body/required", method:"PUT", json : { "a" : 1, "c" : 3}}, function(err, resp, body) {
					test.equal(resp.statusCode, 403)
					test.deepEqual(body, { code: "ForbiddenError", message: "Must send fields: (b)" });
					test.done();
				});
			});
		});
	},
	testRestrictedBodyFieldValidation : function(test) {
		test.expect(4);
		request({uri:"http://localhost:8080/validation/body/restricted", method:"PUT"}, function(err, resp, body) {
			test.equal(resp.statusCode, 200);
			request({uri:"http://localhost:8080/validation/body/restricted", method:"PUT", json : { "a" : 1, "b" : 2 }}, function(err, resp, body) {
				test.equal(resp.statusCode, 200);
				request({uri:"http://localhost:8080/validation/body/restricted", method:"PUT", json : { "a" : 1, "b" : 3, "d" : 4}}, function(err, resp, body) {
					test.equal(resp.statusCode, 403)
					test.deepEqual(body, { code: "ForbiddenError", message: "Cannot send fields: (d)" });
					test.done();
				});
			});
		});
	},
	testPermittedBodyFieldValidation : function(test) {
		test.expect(4);
		request({uri:"http://localhost:8080/validation/body/permitted", method:"PUT", json : { "a" : 1, "b" : 2 }}, function(err, resp, body) {
			test.equal(resp.statusCode, 200);
			request({uri:"http://localhost:8080/validation/body/permitted", method:"PUT"}, function(err, resp, body) {
				test.equal(resp.statusCode, 200);
				request({uri:"http://localhost:8080/validation/body/permitted", method:"PUT", json : { "a" : 1, "b" : 3, "f" : 5, "g" : 9}}, function(err, resp, body) {
					test.equal(resp.statusCode, 403)
					test.deepEqual(body, { code: "ForbiddenError", message: "Cannot send fields: (f,g)" });
					test.done();
				});
			});
		});
	}, 
	testHeaderValidation : function(test) {
		test.expect(3);
		request({uri:"http://localhost:8080/validation/headers/required", method:"PUT", headers : { "x-application-key" : 1, "x-client-id" : 2 }}, function(err, resp, body) {
			test.equal(resp.statusCode, 200);
			request({uri:"http://localhost:8080/validation/headers/required", method:"PUT", json : { "a" : 1, "b" : 3, "f" : 5, "g" : 9}}, function(err, resp, body) {
				test.equal(resp.statusCode, 403)
				test.deepEqual(body, { code: "ForbiddenError", message: "Must send headers: (x-application-key,x-client-id)" });
				test.done();
			});
		});
	}
}
