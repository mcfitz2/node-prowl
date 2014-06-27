var request = require("request");
var parseXML = require("xml2js").parseString;
var Prowl = function(api_key) {
    this.api_key = api_key;
    this.base_url = "https://api.prowlapp.com/publicapi/";
};
Prowl.prototype.add = function() {};
Prowl.prototype.token = function(callback) {
    var self =  this;
    request.get({url:self.base_url+"retrieve/token", qs:{providerkey:self.api_key}}, function(err, res, body) {
	parseXML(body, function(err, json) {
	    callback(err, json.prowl.retrieve[0].$);
	});
    });
};
Prowl.prototype.apikey = function(token, callback) {
    var self = this;
    request.get({url:self.base_url+"retrieve/apikey", qs:{providerkey:self.api_key, token:token}}, function(err, res, body) {
	parseXML(body, function(err, json) {
	    callback(err, json.prowl.retrieve[0].$);
	});
    });
};
Prowl.prototype.verify = function() {};
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