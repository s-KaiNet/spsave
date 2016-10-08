## Upgrade to spsave 2.x  

Your code for `spsave 1.x`: 
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

Or `spsave 2.x`:

```javascript
var spsave = require("spsave").spsave;

spsave({
    siteUrl: "https://[domain].sharepoint.com/sites/dev",
    username: "[user]@[domain].onmicrosoft.com",
    password: "[password]",
    folder: "SiteAssets",
    fileName: "file.txt",
    fileContent: "hello world"  
})
.then(function(data){
  console.log('File uploaded!');
})
.catch(function(err){
  console.log('Error occurred');
});
```

Now you need to write: 
```javascript
    var creds = {
        username: "[user]@[domain].onmicrosoft.com",
        password: "[password]"
    };
    var fileOpts: {
        folder: "SiteAssets",
        fileName: "file.txt",
        fileContent: "hello world"
    };

    var coreOpts = {
        siteUrl: '[https://your sp site/']
    };

    spsave(coreOpts, creds, fileOpts)
    .then(function(data){
        console.log('File uploaded!');
    })
    .catch(function(err){
        console.log('Error occurred');
    });
```

## Uploading to SharePoint hosted app web
`appWebUrl` is deprecated in since `spsave 2.x`.  
If you are uploading something to SharePoint hosted app web, all you need is to provide the url to your app web in the format `[host url]/AppWebName`.  

For example you have `http://sp2013dev/sites/dev` host site and `http://app-ff155d312cfc7e.apps.dev.com/sites/dev/MyNotifications`.
In this case `MyNotifications` is your app web. You need to set `siteUrl: 'http://sp2013dev/sites/dev/MyNotifications'` for `spsave`