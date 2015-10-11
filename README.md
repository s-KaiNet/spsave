# spsave

Nodejs module for saving files in SharePoint (both on premise and online). 

----------

Install: 
------

`npm install spsave`  


Usage: 
----

```javascript
var spsave = require("spsave");
spsave(options, callback);
```  



Options:  
----- 

- `siteUrl` - required, string url of the site
- `username` - required, string user name
- `password` - required, string password
- `folder` - required, site-relative url to folder, which will be used to save your file. For example for library `http://sp2013/sites/dev/SiteAssets` folder will be equal `SiteAssets`, `SiteAssets/subfolder` for subfolder. Now you can pass any path, if its not exist, spsave will attempt to create it (thanks [@dimkk](https://github.com/dimkk "@dimkk")). For example you can specify `SiteAssets/myapp/templates/home`, then full folder hierarchy will be created.
- `fileName` - required, string file name
- `fileContent` - required, string file content
- `domain` - for on premise only, string domain name
- `workstation` - for on premise only, string workstation name
- `isOnPrem` - optional, function returns boolean, used to determine if the site is SharePoint online or on premise, default implementation - `return (urlparse(url)).host.indexOf(".sharepoint.com") === -1;`
- `log` - optional, boolean to enable verbose logging inside spsave, default is false
- `appWebUrl` - optional, site-relative string url to your app web (for apps development). For example if your root web is `http://sp2013.com/sites/dev` and app full url is `http://sp2013-apps.[guid].com/sites/dev/yourapp`, then `appWebUrl` will be `yourapp`


Callback
-----
Function which accepts error object as first argument and result of file upload as second. 


Samples
---
Upload file `file.txt` to SharePoint online site into the SiteAssets library: 

```javascript
var spsave = require("spsave");

spsave({
	siteUrl: "https://[domain].sharepoint.com/sites/dev",
	username: "[user]@[domain].onmicrosoft.com",
	password: "[password]",
	folder: "SiteAssets",
	fileName: "file.txt",
	fileContent: "hello world"	
}, function(err, data){
	if(err){
		console.log("Error occurred");
	} else{
		console.log(data);
	}
});
``` 

SharePoint on premise version: 
```javascript
var spsave = require("spsave");

spsave({
	siteUrl: "[siteurl]",
	username: "[username]",
	password: "[password]",
	workstation: "[workstation name]",
	domain: "[domain name]",
	folder: "SiteAssets",
	fileName: "file.txt",
	fileContent: "hello world"	
}, function(err, data){
	if(err){
		console.log("Error occurred");
	} else{
		console.log(data);
	}
});
``` 
Develop
---

`npm install -g mocha supervisor`

test:
-

`mocha` - will run tests in `test` folder
`npm run autotest` - will run autotesting
 