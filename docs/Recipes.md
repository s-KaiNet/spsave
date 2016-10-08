## `spsave` recipes

On this page you can find different options supported by `spsave`.  

As you may noted from [README](https://github.com/s-KaiNet/spsave), `spsave` supports all authentication options `node-sp-auth` provides. All you need is to pass appropriate credentials object. Refer to `node-sp-auth` [credentialsOptions object](https://github.com/s-KaiNet/node-sp-auth#params).  
For example SharePoint on-premise addin only authentication with `spsave` (consider `creds` variable): 

```javascript
var coreOptions = {
  siteUrl: '[sp url]'
};
var creds = {
  clientId: '[clientId]',
  issuerId: '[issuerId]',
  realm: '[realm]',
  rsaPrivateKeyPath: '[rsaPrivateKeyPath]',
  shaThumbprint: '[shaThumbprint]'
};

var fileOptions = {
  folder: 'SiteAssets',
  fileName: 'file.txt',
  fileContent: 'hello world'
};
spsave(coreOptions, creds, fileOptions)
.then(function(){
    console.log('saved');
})
.catch(function(err){
    console.log(err);
});
```
... or  SharePoint online user credentials authentication: 

```javascript
var coreOptions = {
  siteUrl: '[sp url]'
};
var creds = {
  username: '[user@organization.onmicrosoft.com]',
  password: '[password]'
};

var fileOptions = {
  folder: 'SiteAssets',
  fileName: 'file.txt',
  fileContent: 'hello world'
};
spsave(coreOptions, creds, fileOptions)
.then(function(){
    console.log('saved');
})
.catch(function(err){
    console.log(err);
});
``` 
as simple as that.   
  


Lets assume we have core options like `siteUrl` and creds. The most interesting options are file content option, so lets take a closer look to all possible scenarios.   

As you may know there are three types of file content options - file content, glob, vinyl file. 

## File content options

##### Save file using its name and content. Additionally perform major checkin:
```javascript
spsave({
  siteUrl: '[sp url]',
  checkin: true,
  checkinType: 1
}, 
creds, {
  folder: 'SiteAssets',
  fileName: 'file.txt',
  fileContent: 'hello world'
})
```
###### Result: 
New file `file.txt` will be uploaded to `[sp site url]/SiteAssets`. If `SiteAssets` is document library, file will be visible as new file in document library.  
If `SiteAssets` folder doesn't exist, `spsave` will create that folder. Also the file will be checked in with major version.

##### Save file using its name and content, update metadata for the file:
```javascript
spsave({
  siteUrl: '[sp url]',  
  filesMetaData: [{
          fileName: 'file.txt',
          metadata: {
            '__metadata': { type: 'SP.Data.SiteAssetsItem' },
            Title: title
          }
        }]
}, creds, {
  folder: 'SiteAssets',
  fileName: 'file.txt',
  fileContent: 'hello world'
})
```
###### Result: 
New file `file.txt` will be uploaded to `[sp site url]/SiteAssets`. If `SiteAssets` is document library, file will be visible as new file in document library.  
If `SiteAssets` folder doesn't exist, `spsave` will create that folder. Field "Title" will be updated with title provided. 

##### Upload search display template to master page gallery:
```javascript
spsave({
  siteUrl: '[sp url]',
  filesMetaData: [{
          fileName: 'Item_Template.js',
          metadata: {
            '__metadata': { type: 'SP.Data.OData__x005f_catalogs_x002f_masterpageItem' },
            Title: 'SPSave Display Template',
            DisplayTemplateLevel: 'Item',
            TargetControlType: {
              '__metadata': {
                'type': 'Collection(Edm.String)'
              },
              'results': [
                'SearchResults'
              ]
            },
            ManagedPropertyMapping: `'Title':'Title','Path':'Path','Description':'Description'`,
            ContentTypeId: '0x0101002039C03B61C64EC4A04F5361F38510660500A0383064C59087438E649B7323C95AF6',
            TemplateHidden: false
          }
        }]
}, creds, {
  folder: '_catalogs/masterpage/Display Templates/Search',
  fileName: 'Item_Template.js',
  fileContent: '<javascript content>'
})
```
###### Result: 
New display template `Item_Template.js` will be uploaded to master page gallery. Metadata for the template will be updated.

##### Save binary file using nodejs `fs.readFileSync` function, show notificatin upon upload (or error if any):
```javascript
spsave({
  siteUrl: '[sp url]',
  notification: true
}, creds, {
  folder: 'SiteAssets/app/templates',
  fileName: 'file.txt',
  fileContent: fs.readFileSync('file.txt')
})
```
###### Result: 
New file `file.txt` will be uploaded to `[sp site url]/SiteAssets/app/templates/`. If `SiteAssets/app/templates/` doesn't exists, full folders hierarchy wil be created by `spsave`


## Glob options
##### Save file by its path (file content and file name will be extracted automatically):
```javascript
spsave({
  siteUrl: '[sp url]'
}, creds, {
  glob: 'myapp/files/file.txt',
  folder: 'SiteAssets'
})
```
###### Result:
New file `file.txt` will be uploaded to `[sp site url]/SiteAssets`

##### Save file by its path with base option:
```javascript
spsave({
  siteUrl: '[sp url]'
}, creds, {
  glob: 'myapp/data/files/file.txt',
  folder: 'SiteAssets',
  base: 'myapp'
})
```
###### Result:
New file `file.txt` will be uploaded to `[sp site url]/SiteAssets/data/files` (because of `base` option)

##### Save file by its path without folder option:
```javascript
spsave({
  siteUrl: '[sp url]'
}, creds, {
  glob: 'myapp/data/files/file.txt',
  base: 'myapp'
})
```
###### Result:
New file `file.txt` will be uploaded to `[sp site url]/data/files/` (because of `folder` is missing, `data` becomes root folder)

##### Save multiple files by mask, preserve folder structure (base options is used):
```javascript
spsave({
  siteUrl: '[sp url]'
}, creds, {
  glob: 'myapp/**/*.*',
  base: 'myapp',
  folder: 'SiteAssets'
})
```
###### Result:
All files from `myapp` local folder will be uploaded to `SiteAssets` folder. `spsave` will preserve folder structure if `myapp` has any subfolders.

##### Save multiple files by mask, flatten structure:
```javascript
spsave({
  siteUrl: '[sp url]'
}, creds, {
  glob: 'myapp/**/*.*',
  folder: 'SiteAssets'
})
```
###### Result:
All files from `myapp` local folder will be uploaded to `SiteAssets` folder using flatten structure (`base` option is missing).

##### Save multiple different files:
```javascript
spsave({
  siteUrl: '[sp url]'
}, creds, {
  glob: ['myapp/files/file.txt', 'myapp/templates/home.html'],
  folder: 'SiteAssets'
})
```
###### Result:
Two files will be uploaded to `[sp site url]/SiteAssets` - `file.txt` and `home.html`

## Vinyl file options:

##### Pipe vinyl file and save it to SharePoint:
```javascript
var vfs = require('vinyl-fs');
var map = require('map-stream');

vfs.src('files/file.txt')
  .pipe(map(function(file, cb) {
    spsave({
      siteUrl: '[sp url]'
    }, creds, {
      file: file,
      folder: 'SiteAssets'
    })
    .then(function(){ console.log('success'); })
    .finally(function(){ cb(); });
```
###### Result:
New file `file.txt` will be uploaded to `[sp site url]/SiteAssets`

##### Pipe vinyl file with base option and upload to subfolder using base:
```javascript
var vfs = require('vinyl-fs');
var map = require('map-stream');

vfs.src('myapp/data/files/file.txt', { base: 'myapp' })
  .pipe(map(function(file, cb) {
    spsave({
      siteUrl: '[sp url]'
    }, creds, {
      file: file,
      folder: 'SiteAssets'
    })
    .then(function(){ console.log('success'); })
    .finally(function(){ cb(); });
```
###### Result:
New file `file.txt` will be uploaded to `[sp site url]/SiteAssets/data/files`
