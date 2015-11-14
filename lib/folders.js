/* global Buffer */
var setAuth = require('./setAuth');
var Q = require('q');
var util = require("util");
var LoggerFunc = require("./logger");
var logger;

function checkAndCreateIfNotExist(webUrl, options, digestValue, auth, httprequest, onPrem, cb){
	logger = new LoggerFunc(options.log);
	logger.verbose('checking path to exist: ' + options.folder);
	var folders = options.folder;
	var foldersArray = getFolderPathsArray(folders);
	var proms = [];
	foldersArray.forEach(function (val, index) {
		var getFolderUrl = util.format("/_api/web/GetFolderByServerRelativeUrl(@FolderName)" +
				"?@FolderName='%s'", encodeURIComponent(val));
			var opts = {
				headers: {
					"Accept": "application/json;odata=verbose"
				}
			};
			setAuth(options, auth, opts, onPrem);
			var def = Q.defer();
			httprequest.get(webUrl.href + getFolderUrl, opts, function(err, res){
				logger.verbose('checking path to exist: ' + val);
					if (err) {
						logger.error(JSON.stringify(err));
					return;
				} else {
					logger.verbose(res);
					var data = JSON.parse(res.body);
					
					if (data.error) {
						logger.error("Folder '" + val + "' doesn't exist and will be created");
					} else {
						logger.verbose('exists');
					}
					
					def.resolve(data);
				}
			})
			proms.push(def.promise);
	});

	Q.all(proms).then(function(data){
		var erroredIndexes = data.map(function(val, index){
			if (val.error){
				return index;
			}
		}).filter(function(x) {return x != undefined});
		var pathArray = [];
		erroredIndexes.forEach(function(val, index){
			var path = foldersArray[val];
			pathArray.push(path);
		})
		if (pathArray.length > 0){
			createPath(pathArray).then(function(){
				cb(webUrl, options, digestValue, auth);
			});
		} else {
			cb(webUrl, options, digestValue, auth);
		}		
	})
	
	function createPath(path, def){ //recursive folder create method
		if (!def) def = Q.defer();
		if (path.length > 0){
			logger.verbose('inside createpath: ' + path[0]);
		var setFolder = util.format("/_api/web/folders");
		var body = "{'__metadata': {'type': 'SP.Folder'}, 'ServerRelativeUrl': '"+ path[0] +"'}";
		var opts = {
					headers: {
						"Accept": "application/json;odata=verbose",
						"X-RequestDigest": digestValue,
						"content-type": "application/json;odata=verbose",
						"content-length": Buffer.byteLength(body)
					},
					body: body
				};
		setAuth(options, auth, opts, onPrem);
		httprequest.post(webUrl.href + setFolder, opts, function (err, res) {
			logger.verbose('inside createpath httprequest: ' + path);
				if (err) {
					logger.error('create '+ path +' error:' + JSON.stringify(err));
					return;
				} else {
					var data = JSON.parse(res.body);

					if (data.error) {
						logger.error('create '+ path +' error: ' + JSON.stringify(data.error));
						return;
					} else {
						logger.verbose('created path: '+ path);
						createPath(path.slice(1, path.length), def);
					}
				}
			});
		} else {
			def.resolve()
		} 
		
		return def.promise;
	}	
}

function getFolderPathsArray(folder) {
	var folderNamesArray = folder.split('/');
	var foldersArray = [];
	for (var i = 0; i < folderNamesArray.length; i++) {
		var pathArray = [];
		for (var r = 0; r <= i; r++) {
			pathArray.push(folderNamesArray[r]);
		}
		foldersArray.push(pathArray.join('/'));
	}
	return foldersArray;
}


module.exports = {
	checkAndCreateIfNotExist: checkAndCreateIfNotExist,
	getFolderPathsArray: getFolderPathsArray
};