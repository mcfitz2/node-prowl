var request = require("request");
var parseXML = require("xml2js").parseString;
var Prowl = function(provider_key) {
    this.provider_key = provider_key;
    this.base_url = "https://api.prowlapp.com/publicapi/";
};
Prowl.prototype.add = function(params, callback) {
    var self = this;
    if (!(params.apikey && params.application && params.event && params.description)) {
	throw new Error("Missing parameters");
    }
    if (params.apikey instanceof Array) {
	params.apikey = params.apikey.join(",");
    }
    params.providerkey = self.provider_key;
    request.post({
	url:self.base_url+"add",
	form:params
    }, function(err, res, body) {
	parseXML(body, function(err, json) {
	    console.log(JSON.stringify(json.prowl, null, "\t"));
	    if (json.prowl.error && !err) {
		err = json.prowl.error;
	    }
	    callback(err, json.prowl);
	});
    }); 
};
Prowl.prototype.token = function(callback) {
    var self =  this;
    if (!self.provider_key) {
	throw new Error("This action requires a provider key");
    }
    request.get({url:self.base_url+"retrieve/token", qs:{providerkey:self.provider_key}}, function(err, res, body) {
	parseXML(body, function(err, json) {
	    callback(err, json.prowl.retrieve[0].$);
	});
    });
};
Prowl.prototype.apikey = function(token, callback) {
    var self = this;
    if (!self.provider_key) {
	throw new Error("this action requires a provider key");
    }
    request.get({url:self.base_url+"retrieve/apikey", qs:{providerkey:self.provider_key, token:token}}, function(err, res, body) {
	parseXML(body, function(err, json) {
	    callback(err, json.prowl.retrieve[0].$);
	});
    });
};
Prowl.prototype.verify = function(params, callback) {
    var self = this;
    if (!params.apikey) {
	throw new Error("missing parameters");
    }
    params.providerkey = self.provider_key;
    request.get({url:self.base_url+"verify", qs:params}, function(err, res, body) {
	parseXML(body, function(err, json) {
	    console.log(JSON.stringify(json.prowl, null, "\t"));
	    if (json.prowl.error && !err) {
		err = json.prowl.error;
	    }
	    callback(err, json.prowl);
	});
    });
};
Prowl.prototype.middleware = function(callback) {
    var self = this;
    return function(req, res, next) {
	if (req.query && req.query.token) { //callback stage
	    self.apikey(req.query.token, function(err, res) {
		callback(req, res.apikey, function(err) {
		    req.error = err;
		    next();
		});
            });
	} else { //get token stage
	    self.token(function(err, result) {
		res.redirect(result.url);
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