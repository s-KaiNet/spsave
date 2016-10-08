## spsave 3.x

 - refactored `spsave` parameters. All parameters now are divided by type - core options for `spsave`, credentials, file(s) options
 - `spsave` now depends implicitly (throught the `sp-request`) on [node-sp-auth](https://github.com/s-KaiNet/node-sp-auth) module and use the set of credentials which `node-sp-auth` accepts. That means that `spsave` supports all authentication options supported by `node-sp-auth`


## spsave 2.x

- switch to TypeScript
- added `checkinMessage` option
- added `notification` option with help of [node-notifier](https://github.com/mikaelbr/node-notifier) module
- added Glob option for uploading multiple files
- added vinyl File option
- performance improvements (especially for SharePoint Online)
- promises instead of callbacks
- added unit testing and integration testing
- removed `appWebUrl`, `log`, `isOnPrem` options