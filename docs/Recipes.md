## `spsave` recipes

On this page you can find different options supported by `spsave`. Lets assume we have some core options like `siteUrl`, `username`, `password`. The most interesting options are file content option, so lets take a closer look to all possible scenarios.   

As you may know there are three types of file content options - file content, glob, vinyl file. 

## File content options

##### Save file using its name and content. Additionally perform major checkin:
```javascript
spsave({
  siteUrl: '[sp url]',  username: '[username]', password: '[password]',
  folder: 'SiteAssets',
  fileName: 'file.txt',
  fileContent: 'hello world',
  checkin: true,
  checkinType: 1
})
```
###### Result: 
New file `file.txt` will be uploaded to `[sp site url]/SiteAssets`. If `SiteAssets` is document library, file will be visible as new file in document library.  
If `SiteAssets` folder doesn't exist, `spsave` will create that folder. Also the file will be checked in with major version.

##### Save binary file using nodejs `fs.readFileSync` function, show notificatin upon upload (or error if any):
```javascript
spsave({
  siteUrl: '[sp url]',  username: '[username]', password: '[password]',
  folder: 'SiteAssets/app/templates',
  fileName: 'file.txt',
  fileContent: fs.readFileSync('file.txt'),
  notification: true
})
```
###### Result: 
New file `file.txt` will be uploaded to `[sp site url]/SiteAssets/app/templates/`. If `SiteAssets/app/templates/` doesn't exists, full folders hierarchy wil be created by `spsave`


## Glob options
##### Save file by its path (file content and file name will be extracted automatically):
```javascript
spsave({
  siteUrl: '[sp url]',  username: '[username]', password: '[password]',
  glob: 'myapp/files/file.txt',
  folder: 'SiteAssets'
})
```
###### Result:
New file `file.txt` will be uploaded to `[sp site url]/SiteAssets`

##### Save file by its path with base option:
```javascript
spsave({
  siteUrl: '[sp url]',  username: '[username]', password: '[password]',
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
  siteUrl: '[sp url]',  username: '[username]', password: '[password]',
  glob: 'myapp/data/files/file.txt',
  base: 'myapp'
})
```
###### Result:
New file `file.txt` will be uploaded to `[sp site url]/data/files/` (because of `folder` is missing, `data` becomes root folder)

##### Save multiple files by mask, preserve folder structure (base options is used):
```javascript
spsave({
  siteUrl: '[sp url]',  username: '[username]', password: '[password]',
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
  siteUrl: '[sp url]',  username: '[username]', password: '[password]',
  glob: 'myapp/**/*.*',
  folder: 'SiteAssets'
})
```
###### Result:
All files from `myapp` local folder will be uploaded to `SiteAssets` folder using flatten structure (`base` option is missing).

##### Save multiple different files:
```javascript
spsave({
  siteUrl: '[sp url]',  username: '[username]', password: '[password]',
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
      siteUrl: '[sp url]',  username: '[username]', password: '[password]',
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
      siteUrl: '[sp url]',  username: '[username]', password: '[password]',
      file: file,
      folder: 'SiteAssets'
    })
    .then(function(){ console.log('success'); })
    .finally(function(){ cb(); });
```
###### Result:
New file `file.txt` will be uploaded to `[sp site url]/SiteAssets/data/files`
