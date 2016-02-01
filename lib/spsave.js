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
					"content-length": options.fileContent.length
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
				
					if (options.checkin) {
						checkIn(webUrl, options, digestValue, auth, onPrem);
					} else {
						onreadyCallback(null, data);
					}
				}
			});
		});
	}
	
    	
	// This function tries to check in the file using the _api.
	// There seems to be an issue checking in forms in libraries. When Checkin errors occur the code shows a warning but continues.
	function checkIn(webUrl, options, digestValue, auth, onPrem) {

	    var checkinType = getCheckinType(options);
	    var checkinComment = "Checked in from npm spsave";

	    // File to check out/check in
	    var FileServerRelativeUrl = webUrl.path + "/" + options.folder + options.fileName;

	    var siteCollectionUrl = webUrl.href;

	    var checkinOutOptions = {
	        headers: {
	            "Accept": "application/json;odata=verbose",
	            "X-RequestDigest": digestValue
	        }
	    };
	    setAuth(options, auth, checkinOutOptions, onPrem);

	    var determineCheckedOutRequest = util.format("%s_api/web/GetFileByServerRelativeUrl('%s')", siteCollectionUrl, encodeURIComponent(FileServerRelativeUrl));
	    var checkoutRequest = util.format("%s_api/web/GetFileByServerRelativeUrl('%s')/CheckOut()", siteCollectionUrl, encodeURIComponent(FileServerRelativeUrl));
	    var checkinRequest = util.format("%s_api/web/GetFileByServerRelativeUrl('%s')/CheckIn(comment='%s',checkintype=%s)", siteCollectionUrl, encodeURIComponent(FileServerRelativeUrl), checkinComment, checkinType);

	    var executeCheckinRequest = function () {
	        httprequest.post(checkinRequest, checkinOutOptions, function (err, res) {
	            if (err) {
	                writeToLog(util.format("File '%s' was not checked in. reason: %s", options.fileName, JSON.stringify(err)), "yellow");
	                onreadyCallback(null, data);
	                return;
	            } else {
	                var data = JSON.parse(res.body);

	                if (data.error) {
	                    writeToLog(util.format("File '%s' was not checked in. reason: %s", options.fileName, JSON.stringify(data.error)), "yellow");
	                    onreadyCallback(null, data);
	                    return;
	                }
                    
	                writeToLog(util.format("File '%s' successfully checked in. checkinType: %s", options.fileName, checkinType), "green");

	                onreadyCallback(null, data);
	            }
	        });
	    }

	    var executeCheckOutCheckInRequest = function () {
	        httprequest.post(checkoutRequest, checkinOutOptions, function (err, res) {
	            if (handleCheckInError(err, res)) {

	                writeToLog(util.format("File '%s' successfully checked out.", options.fileName), "green");

	                // Do check in request
	                executeCheckinRequest();
	            }
	        });
	    }

	    httprequest.post(determineCheckedOutRequest, checkinOutOptions, function (err, res) {
	        if (handleCheckInError(err, res)) {
	            // No errors occured, continue
	            var data = JSON.parse(res.body);

	            if (data.d.CheckOutType == 0) {
	                // checked out , just check in 
	                executeCheckinRequest();
	            } else {
	                // not checked out, check out then check in
	                executeCheckOutCheckInRequest();
	            }
	        }
	    });
	}

	function writeToLog(message, safeColor) {
	    var dateNow = new Date();
	    var dateString = util.format("[%s:%s:%s]", ("0" + dateNow.getHours()).slice(-2), ("0" + dateNow.getMinutes()).slice(-2), ("0" + dateNow.getSeconds()).slice(-2));
	    logger.log(util.format("%s %s", dateString, message), safeColor);
	}

	// Resolves an http request error.
	// If an error occurs it logs fails and executes the callback.
	// Returns true if no errors occured.
	function handleCheckInError(err, res) {
	    if (err) {
	        onreadyCallback(err);
	        return false;
	    } else {
	
	        var data = JSON.parse(res.body);
	
	        if (data.error) {
	            logger.error(JSON.stringify(data.error));
	            onreadyCallback(new Error(JSON.stringify(data.error)));
	            return false;
	        }
	    }
	    return true;
	}
	
	// Determine the checkin type
	// 1 majorCheckIn Enumeration whose values are incremented as a major version. 
	// 0 minorCheckIn Enumeration whose values are incremented as minor version. 
	// 2 overwriteCheckIn Enumeration whose values overwrite the file. 
	function getCheckinType(options) {
		var checkinType = 0;
		
		if (options.checkinType === undefined) {
		    checkinType = 0;
		} else {
		    switch (options.checkinType) {
		    case 'minor':
		    case 0:
		    default:
		        checkinType = 0
		        break;
		    case 'major':
		    case 1:
		        checkinType = 1
		        break;
		
		    case 'overwrite':
		    case 2:
		        checkinType = 2
		        break;
		    }
		}
		return checkinType;
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


