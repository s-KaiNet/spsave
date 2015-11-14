/* global Buffer */
var SP = require("node-spoauth"),
	folders = require('./folders'),
    urlparse = require('url').parse,
    util = require("util"),
    httpreq = require("httpreq"),
    httpntml = require("httpntlm"),
	LoggerFunc = require("./logger"),
	setAuth = require('./setAuth');

module.exports = function (options, callback) {
	var httprequest,
	onPrem,
	log,
	onreadyCallback,
	logger;
	
	if (!callback) {
		callback = function () { }
	}
	if (!options.isOnPrem) {
		options.isOnPrem = isOnPrem;
	}
	if (typeof options.log !== "boolean") {
		options.log = log = false;
	} else {
		log = options.log;
	}
	logger = new LoggerFunc(options.log);
	
	onreadyCallback = callback;
	
	onPrem = options.isOnPrem(options.siteUrl);

	if (onPrem) {
		httprequest = exhttpntlm;
	} else {
		httprequest = httpreq;
	}

	if (onPrem) {
		spSaveCore(options, {
			username: options.username,
			password: options.password,
			workstation: options.workstation,
			domain: options.domain
		});
	} else {
		var service = new SP.RestService(options.siteUrl);
		service.signin(options.username, options.password, function (err, auth) {
			if (err) {
				logger.error(err);
				onreadyCallback(err);
				return;
			}

			spSaveCore(options, auth);
		});
	}
	
	function spSaveCore(options, auth) {
		var url = urlparse(options.siteUrl);
		getRequestDigest(url, options, auth, function (digestValue) {
			if (options.appWebUrl) {
				getAppWebUrl(options, auth, digestValue, function (appWebUrl) {
					getRequestDigest(appWebUrl, options, auth, function (newDigest) {
						uploadFile(appWebUrl, options, newDigest, auth);
					});
				});
			} else {
				uploadFile(url, options, digestValue, auth);
			}
		});
	}

	function getRequestDigest(url, options, auth, onDigest) {
		var opts = {
			headers: {
				"Accept": "application/json;odata=verbose",
				"content-length": "0"
			}
		};

		setAuth(options, auth, opts, onPrem);
		
		httprequest.post(url.href + "/_api/contextinfo", opts, function (err, res) {
			if (err) {
				logger.error(err);
				onreadyCallback(err);
				return;
			} else {
				var data = JSON.parse(res.body);

				if (data.error) {
					logger.error(data.error);
					onreadyCallback(new Error(JSON.stringify(data.error)));
					return;
				}

				onDigest(data.d.GetContextWebInformation.FormDigestValue);
			}
		});
	}

	function getAppWebUrl(options, auth, digestValue, onGetAppWeb) {
		var dateNow = new Date();
		var dateString = util.format("[%s:%s:%s]", ("0" + dateNow.getHours()).slice(-2), ("0" + dateNow.getMinutes()).slice(-2), ("0" + dateNow.getSeconds()).slice(-2));
		logger.log(util.format("%s Opening '%s' ...", dateString, options.appWebUrl));
		var openWebUrl = util.format("/_api/site/openWeb(@strUrl)?@strUrl='%s'", options.appWebUrl);

		var opts = {
			headers: {
				"Accept": "application/json;odata=verbose",
				"X-RequestDigest": digestValue
			}
		};

		setAuth(options, auth, opts, onPrem);

		var url = urlparse(options.siteUrl);
		httprequest.post(url.href + openWebUrl, opts, function (err, res) {
			if (err) {
				logger.error(err);
				onreadyCallback(err);
				return;
			} else {
				var data = JSON.parse(res.body);

				if (data.error) {
					logger.error(data.error);
					onreadyCallback(new Error(JSON.stringify(data.error)));
					return;
				}

				logger.log("Web full url: " + data.d.Url);
				onGetAppWeb(urlparse(data.d.Url));
			}
		});
	}



	function uploadFile(webUrl, options, digestValue, auth, attempts) {
		attempts = attempts || 1;

		if(attempts > 3){
			logger.error("File '" + options.fileName + "' probably is not uploaded. Too many errors.");
			onreadyCallback(new Error("Too many errors. File upload process interrupted."));
			return;
		}
		folders.checkAndCreateIfNotExist(webUrl, options, digestValue, auth, httprequest, onPrem, function (webUrl, options, digestValue, auth) {
			var uploadRestUrl = util.format("/_api/web/GetFolderByServerRelativeUrl(@FolderName)/Files/add(url=@FileName,overwrite=true)" +
				"?@FolderName='%s'&@FileName='%s'", encodeURIComponent(options.folder), encodeURIComponent(options.fileName));
			var opts = {
				headers: {
					"Accept": "application/json;odata=verbose",
					"X-RequestDigest": digestValue,
					"Content-Type": "text/xml",
					"content-length": Buffer.byteLength(options.fileContent)
				},
				body: options.fileContent
			};

			setAuth(options, auth, opts, onPrem);

			httprequest.post(webUrl.href + uploadRestUrl, opts, function (err, res) {
				if (err) {
					onreadyCallback(err);
					return;
				} else {
					var data = JSON.parse(res.body);

					if (data.error) {
						if(data.error.code && data.error.code.indexOf("-2130246326") === 0){
							logger.error("Save conflict detected for file '" + options.fileName + "'. Trying to re-upload...");
							setTimeout(function(){
								uploadFile(webUrl, options, digestValue, auth, ++attempts);
							}, 1500);
						} else if(data.error.code && data.error.code.indexOf("-1597308888") === 0){
							logger.error("Cobalt error detected for file '" + options.fileName + "'. Trying to re-upload...");
							setTimeout(function(){
								uploadFile(webUrl, options, digestValue, auth, ++attempts);
							}, 1500);
							
						} else{
							logger.error(JSON.stringify(data.error));
							onreadyCallback(new Error(JSON.stringify(data.error)));
						}
						return;
					}

					var dateNow = new Date();
					var dateString = util.format("[%s:%s:%s]", ("0" + dateNow.getHours()).slice(-2), ("0" + dateNow.getMinutes()).slice(-2), ("0" + dateNow.getSeconds()).slice(-2));
					logger.log(util.format("%s File '%s' successfully uploaded to '%s' folder", dateString, options.fileName, options.folder), "green");
					onreadyCallback(null, data);
				}
			});
		});
	}
}

function isOnPrem(url) {
	return (urlparse(url)).host.indexOf(".sharepoint.com") === -1;
}

function exhttpntlm(method, url, opts, callback) {
	opts.url = url;
	return httpntml[method](opts, callback);
}

["get", "post"].forEach(function (method) {
	exhttpntlm[method] = exhttpntlm.bind(this, method);
});


