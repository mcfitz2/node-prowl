var request = require("request");
var parseString = require("xml2js").parseString;
var Prowl = function(provider_key) {
    this.provider_key = provider_key;
    this.base_url = "https://api.prowlapp.com/publicapi/";
    this.remaining = null;
    this.resetTimestamp = null;
};
Prowl.prototype._parseResponse = function(xml, callback) {
    var response = {};
    parseString(xml, function(err, json) {	
	if (err) {
	    return callback(err, null);
	}
	if (json.prowl.error) {
	    return callback(json.prowl.error[0].$, null);
	}
	response.success = json.prowl.success[0].$;
	if (json.prowl.retrieve) {
	    response.retrieve = json.prowl.retrieve[0].$;
	}
	callback(null, response);
    });
};
Prowl.prototype._createHandler = function(callback) {
    var self = this;
    return function(err, res, body) {
	self._parseResponse(body, function(err, res) {
	    self.remaining = res.success.remaining;
	    self.resetTimestamp = res.success.resetdate;
	    callback(err, res);
	});
    };
};
Prowl.prototype.add = function(params, callback) {
    var self = this;
    if (!params.apikey) { throw new Error("Missing apiKey(s)"); }
    if (!params.application) { throw new Error("Missing application name"); }
    if (! (params.description || params.event)) { throw new Error("You must provide an event, a description or both"); }
    if (params.apikey instanceof Array) { params.apikey = params.apikey.join(","); }
    params.providerkey = self.provider_key;
    request.post({
	url:self.base_url+"add",
	form:params
    }, self._createHandler(callback)); 
};
Prowl.prototype.token = function(callback) {
    var self =  this;
    if (!self.provider_key) {
	throw new Error("This action requires a provider key");
    }
    request.get({url:self.base_url+"retrieve/token", qs:{providerkey:self.provider_key}}, self._createHandler(callback));
};
Prowl.prototype.apikey = function(token, callback) {
    var self = this;
    if (!self.provider_key) {
	throw new Error("this action requires a provider key");
    }
    request.get({url:self.base_url+"retrieve/apikey", qs:{providerkey:self.provider_key, token:token}}, self._createHandler(callback));
};
Prowl.prototype.verify = function(params, callback) {
    var self = this;
    if (!params.apikey) {
	throw new Error("Missing apiKey");
    }
    params.providerkey = self.provider_key;
    request.get({url:self.base_url+"verify", qs:params}, self._createHandler(callback));
};
Prowl.prototype.middleware = function(callback) {
    var self = this;
    return function(req, res, next) {
	if (req.query && req.query.token) { //callback stage
	    self.apikey(req.query.token, function(err, res) {
		callback(req, res.retrieve.apikey, function(err) {
		    req.error = err;
		    next();
		});
            });
	} else { //get token stage
	    self.token(function(err, response) {
		res.redirect(response.retrieve.url);
            });
	}
    };
};
module.exports = Prowl;
if (require.main == module) {
    var p = new Prowl("a99620718bec8d9cd4fb1806327cdf97c900fe08");
    p.token(function(err, res) {
	console.log(res);
	setTimeout(function() {
	    p.apikey(res.token, function(err, res) {
		console.log(res.prowl);

	    });
	}, 20000);
    });
}