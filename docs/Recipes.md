## `spsave` recipes

On this page you can find different options supported by `spsave`. Lets assume we have some core options like `siteUrl`, `username`, `password`. The most interesting options are file content option, so lets take a closer look on all possible scenarios.   

As you may know there are three types of file content options - file content, glob, vinyl file. 

## File content options

##### input:
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
##### result: 
New file `file.txt` will be uploaded to `[sp site url]/SiteAssets`. If `SiteAssets` is document library, file will be visible as new file in document library.  
If `SiteAssets` folder doesn't exist, `spsave` will create that folder. Also the file will be checked in with major version.

##### input:
```javascript
spsave({
  siteUrl: '[sp url]',  username: '[username]', password: '[password]',
  folder: 'SiteAssets/app/templates',
  fileName: 'file.txt',
  fileContent: fs.readFileSync('file.txt')
})
```
##### result: 
New file `file.txt` will be uploaded to `[sp site url]/SiteAssets/app/templates/`. If `SiteAssets/app/templates/` doesn't exists, full folders hierarchy wil be created by `spsave`


## Glob options
##### input:
```javascript
spsave({
  siteUrl: '[sp url]',  username: '[username]', password: '[password]',
  glob: 'myapp/files/file.txt',
  folder: 'SiteAssets'
})
```
##### result:
New file `file.txt` will be uploaded to `[sp site url]/SiteAssets`

##### input:
```javascript
spsave({
  siteUrl: '[sp url]',  username: '[username]', password: '[password]',
  glob: 'myapp/files/file.txt',
  folder: 'SiteAssets',
  base: 'myapp'
})
```
##### result:
New file `file.txt` will be uploaded to `[sp site url]/SiteAssets/files` (because of `base` option)

##### input:
```javascript
spsave({
  siteUrl: '[sp url]',  username: '[username]', password: '[password]',
  glob: 'myapp/files/file.txt',
  base: 'myapp'
})
```
##### result:
New file `file.txt` will be uploaded to `[sp site url]/files/` (because of `folder` is missing, `files` becomes root folder)

##### input:
```javascript
spsave({
  siteUrl: '[sp url]',  username: '[username]', password: '[password]',
  glob: 'myapp/**/*.*',
  base: 'myapp',
  folder: 'SiteAssets'
})
```
##### result:
All files from `myapp` local folder will be uploaded to `SiteAssets` folder. `spsave` will preserve folder structure if `myapp` has any subfolders.

##### input:
```javascript
spsave({
  siteUrl: '[sp url]',  username: '[username]', password: '[password]',
  glob: 'myapp/**/*.*',
  folder: 'SiteAssets'
})
```
##### result:
All files from `myapp` local folder will be uploaded to `SiteAssets` folder using flatten structure (`base` option is missing).

##### input:
```javascript
spsave({
  siteUrl: '[sp url]',  username: '[username]', password: '[password]',
  glob: ['myapp/files/file.txt', 'myapp/templates/home.html'],
  folder: 'SiteAssets'
})
```
##### result:
Two files will be uploaded to `[sp site url]/SiteAssets` - `file.txt` and `home.html`

## Vinyl file options:

##### input:
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
##### result:
New file `file.txt` will be uploaded to `[sp site url]/SiteAssets`

##### input:
```javascript
var vfs = require('vinyl-fs');
var map = require('map-stream');

vfs.src('myapp/files/file.txt', { base: 'myapp' })
  .pipe(map(function(file, cb) {
    spsave({
      siteUrl: '[sp url]',  username: '[username]', password: '[password]',
      file: file,
      folder: 'SiteAssets'
    })
    .then(function(){ console.log('success'); })
    .finally(function(){ cb(); });
```
##### result:
New file `file.txt` will be uploaded to `[sp site url]/SiteAssets/files`
