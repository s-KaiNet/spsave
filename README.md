# spsave 

[![NPM](https://nodei.co/npm/spsave.png?mini=true)](https://nodei.co/npm/spsave/)

[![Circle CI](https://circleci.com/gh/s-KaiNet/spsave/tree/master.svg?style=shield&circle-token=07b67ce9b17508e7f4f2a75f6a2e3907260c2fc5)](https://circleci.com/gh/s-KaiNet/spsave/tree/master)
[![Coverage Status](https://coveralls.io/repos/github/s-KaiNet/spsave/badge.svg?branch=master)](https://coveralls.io/github/s-KaiNet/spsave?branch=master)
[![npm version](https://badge.fury.io/js/spsave.svg)](https://badge.fury.io/js/spsave)

### Need help on SharePoint with Node.JS? Join our gitter chat and ask question! [![Gitter chat](https://badges.gitter.im/gitterHQ/gitter.png)](https://gitter.im/sharepoint-node/Lobby)

Nodejs module for saving files in SharePoint: 
 - SharePoint 2013, 2016 
 - SharePoint Online

----------
 `spsave` depends heavily on another module [sp-request](https://github.com/s-KaiNet/sp-request) and use it to send REST queries to SharePoint. `sp-request`, in turns, depends on the module responsible for SharePoint authentiation from node js - [node-sp-auth](https://github.com/s-KaiNet/node-sp-auth).  
[CHANGELOG](docs/CHANGELOG.md) 


---

## How to use:
#### Install:
```bash
npm install spsave --save-dev
```
#### Usage:
```javascript
var spsave = require("spsave").spsave;

spsave(coreOptions, creds, fileOptions)
.then(successHandler)
.catch(errorHandler);
```
## Using with gulp
You have following options:  

1. Use official gulp plugin for `spsave` - [gulp-spsave](https://github.com/s-KaiNet/gulp-spsave)
2. Use `spsave` inside gulp tasks or in watchers like this: 

        var spsave = require("spsave").spsave;
        
        gulp.task('spsave', function(cb) {
            
          spsave(coreOptions, creds, fileOptions)
          .then(function(){
              cb();
          }).catch(cb);
          
        );

3. Use both approaches. First one is handy if you are processing files in a stream, for example you need minimize, concatenate and then upload. The second can be used if you want just upload files and that's it. 


## Using with SharePoint hosted apps (uploading to app web)
Please refer to [this page](docs/UpgradeToSPSaveLatest.md) (at the bottom) 


## options:
Starting from `spsave 3.x` all options divided by logical categories (in order): 
 - core options 
 - credentials
 - file(s) options

#### Core options:
- `siteUrl` - required, string url of the site
- `checkin` - optional, boolean to allow the files to be checked in/published
- `checkinType` - optional number, used when `checkin` options is true
    - `0` - minor
    - `1` - major
    - `2` - overwrite
- `checkinMessage` - optional string, you can provide your own checkin message, otherwise default will be used
- `notification` - optional boolean, when true, `spsave` will notify about successful upload using [node-notifier](https://github.com/mikaelbr/node-notifier) module
- `filesMetaData` - optional, array of `IFileMetaData`: 
    - `fileName` - required, string file name
    - `metadata` - metadata object 

#### Credentials: 

`spsave 3.x` implicitly depends on another module used for SharePoint authentication from node js - [node-sp-auth](https://github.com/s-KaiNet/node-sp-auth). For `spsave` credentials param you need to pass exactly the same object, as for `node-sp-auth` [credentialsOptions object](https://github.com/s-KaiNet/node-sp-auth#params). That also means that `spsave` supports all authentication options supported by `node-sp-auth`. On [Recipes page](docs/Recipes.md) you can find a bit more samples.   
You can also pass a `null` as credentials, in that case `spsave` will ask you for credentials and will store your credentials in a user folder in an encrypted manner (everything is handled by `node-sp-auth` actually). 

#### File(s) options: 

File options used to tell `spsave` how to find\load the file to be uploaded to SharePoint. When one is used, others are ignored. There are three file options supported: file content, glob and vinyl file.

##### File content options:
- `folder` - required string, site-relative url to folder, which will be used to save your file. For example for library `http://sp2013/sites/dev/SiteAssets` folder will be equal to `SiteAssets`, `SiteAssets/subfolder` for sub folder. If the folder doesn't exist, `spsave` will create that folder and all sub folders if required (full hierarchy)
- `fileName` - required, string file name
- `fileContent` - required, string or buffer file content (binary files supported, you can do something like this: `fileContent: fs.readFileSync('app/img/logo.png')`)

##### Glob options (you can provide a mask to read all or certain files from the file system):
- `glob` - required, string or string array, i.e. `'build/css/style.css'` or `['build/css/*.*']`. Pattern is similar to [node-glob](https://github.com/isaacs/node-glob) module.
- `base` - optional string, if you want to preserve folders structure inside SharePoint folder, you can provide a base for you files. For example when using glob `['build/css/*.*']` and `base: 'build'`, all css files will be loaded under `[SharePoint folder]/css`
- `folder` - optional string, site-relative url to folder, which will be used to save your file. The same as for file content options. If the folder is null or empty, `spsave` will try to resolve folder using `base` option provided

##### Vinyl options. If you are familiar with [vinyl](https://github.com/gulpjs/vinyl) and [vinyl-fs](https://github.com/gulpjs/vinyl-fs) you can provide vinyl file directly:
- `file` - required, vinyl File object
- `folder` - optional string, site-relative url to folder, which will be used to save your file. The same as for file content options. If the folder is null or empty, `spsave` will try to resolve the folder using `base` of vinyl file

Don't be scared and confused with a lot of options and take a look at the [Recipes](docs/Recipes.md) page. You can find all possible scenarios with `spsave`, input params and expected output.
#### successHandler
Handler gets called upon successful file upload.
#### errorHandler
Handler gets executed in case of exception inside `spsave`. Accepts error object as first argument for callback.

## Samples
Use [Recipes](docs/Recipes.md) page to see **all** different options available with `spsave`.
#### Basic usage:
```javascript
var coreOptions = {
    siteUrl: '[sp url]',
    notification: true,
    checkin: true,
    checkinType: 1
};
var creds = {
    username: '[username]',
    password: '[password]',
    domain: '[domain (on premise)]'
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

## Development:
I recommend using VS Code for development. Repository already contains some settings for VS Code editor.
Before creating Pull Request you need to create an appropriate issue and reference it from PR.  

1. `git clone https://github.com/s-KaiNet/spsave.git`
2. `cd spsave`
3. `git checkout -b myfeature dev`
4. `npm run build` - restores dependencies and runs typescript compilation
5. `gulp live-dev` - setup watchers and automatically runs typescript compilation, tslint and tests when you save files

## Tests:
1. `npm test`. As a result `/reports` folder will be created with test results in junit format and code coverage. Additionally test reports will be available in a console window.

## Integration testing:
1. Rename file `/test/integration/config.sample.ts` to `config.ts`.
2. Update information in `config.ts` with appropriate values (urls, credentials, environment).
3. Run `gulp test-int`.