import * as globby from 'globby';
import * as Promise from 'bluebird';
import * as path from 'path';
import * as fs from 'fs';
import * as _ from 'lodash';
import {IAuthOptions} from 'sp-request';
require('console.table');

import {spsave} from './../../src/core/SPSave';
import {FileOptions, ICoreOptions} from './../../src/core/SPSaveOptions';
import {defer, IDeferred} from './../../src/utils/Defer';

let config: any = require('./config');
let spsaveLegacy: any = require(path.resolve('test/performance/legacy/node_modules/spsave/lib/spsave.js'));

let filesToSave: string[] = globby.sync('test/performance/files/*.*');
let folder: string = 'SiteAssets/files';

let onPremCreds: IAuthOptions = config.onpremCreds;

let onlineCreds: IAuthOptions = config.onlineCreds;

let onpremAddinOnlyCreds: IAuthOptions = config.onpremAddinOnly;

let onlineAddinOnlyCreds: IAuthOptions = config.onlineAddinOnly;

let adfsCreds: IAuthOptions = config.adfsCredentials;

let coreOnlineOptions: ICoreOptions = {
  siteUrl: config.onlineUrl
};

let coreOnpremOptions: ICoreOptions = {
  siteUrl: config.onpremNtlmEnabledUrl
};

let coreAddinOnlyOnPremOptions: ICoreOptions = {
  siteUrl: config.onpremAdfsEnabledUrl
};

let coreAdfsOnPremOptions: ICoreOptions = {
  siteUrl: config.onpremAdfsEnabledUrl
};

let legacyOnPremCreds: any = _.assign(onPremCreds, coreOnpremOptions);
let legacyOnlineCreds: any = _.assign(onlineCreds, coreOnlineOptions);

let legacyOnPremElapsedSeries: number;
let spsaveOnPremElapsedSeries: number;
let legacyOnPremElapsedParallel: number;
let spsaveOnPremElapsedParallel: number;

let legacyOnlineElapsedSeries: number;
let spsaveOnlineElapsedSeries: number;
let legacyOnlineElapsedParallel: number;
let spsaveOnlineElapsedParallel: number;

let spsaveOnpremiseAddinOnlyElapsedSeries: number;
let spsaveOnpremiseAddinOnlyElapsedParallel: number;
let spsaveOnlineAddinOnlyElapsedSeries: number;
let spsaveOnlineAddinOnlyElapsedParallel: number;
let adfsOnpremElapsedSeries: number;
let adfsOnpremElapsedParallel: number;

/* legacy: on-premise series run */
Promise.all([new Date().getTime(), savesFileArraySeriesLegacy(filesToSave, legacyOnPremCreds)])
  .then((data) => {
    legacyOnPremElapsedSeries = new Date().getTime() - data[0];

    /* legacy: on-premise parallel run */
    return Promise.all([new Date().getTime(), saveFilesArrayInParallelLegacy(filesToSave, legacyOnPremCreds)]);
  })
  .then((data) => {
    legacyOnPremElapsedParallel = new Date().getTime() - data[0];

    /* legacy: online series run */
    return Promise.all([new Date().getTime(), savesFileArraySeriesLegacy(filesToSave, legacyOnlineCreds)]);
  })
  .then(data => {
    legacyOnlineElapsedSeries = new Date().getTime() - data[0];

    /* legacy: online parallel run */
    return Promise.all([new Date().getTime(), saveFilesArrayInParallelLegacy(filesToSave, legacyOnlineCreds)]);
  })
  .then(data => {
    legacyOnlineElapsedParallel = new Date().getTime() - data[0];

    /* spsave 3.x: on-premise parallel run */
    return Promise.all([new Date().getTime(), saveFilesArrayInParallel(filesToSave, coreOnpremOptions, onPremCreds)]);
  })
  .then((data) => {
    spsaveOnPremElapsedParallel = new Date().getTime() - data[0];

    /* spsave 3.x: on-premise series run */
    return Promise.all([new Date().getTime(), saveFilesArraySeries(filesToSave, coreOnpremOptions, onPremCreds)]);
  })
  .then((data) => {
    spsaveOnPremElapsedSeries = new Date().getTime() - data[0];

    /* spsave 3.x: online parallel run */
    return Promise.all([new Date().getTime(), saveFilesArrayInParallel(filesToSave, coreOnlineOptions, onlineCreds)]);
  })
  .then(data => {
    spsaveOnlineElapsedParallel = new Date().getTime() - data[0];

    /* spsave 3.x: online series run */
    return Promise.all([new Date().getTime(), saveFilesArraySeries(filesToSave, coreOnlineOptions, onlineCreds)]);
  })
  .then(data => {
    spsaveOnlineElapsedSeries = new Date().getTime() - data[0];

    /* spsave 3.x: on-premise addin only series */
    return Promise.all([new Date().getTime(), saveFilesArraySeries(filesToSave, coreAddinOnlyOnPremOptions, onpremAddinOnlyCreds)]);
  })
  .then(data => {
    spsaveOnpremiseAddinOnlyElapsedSeries = new Date().getTime() - data[0];

    /* spsave 3.x: on-premise addin only parallel */
    return Promise.all([new Date().getTime(), saveFilesArrayInParallel(filesToSave, coreAddinOnlyOnPremOptions, onpremAddinOnlyCreds)]);
  })
  .then(data => {
    spsaveOnpremiseAddinOnlyElapsedParallel = new Date().getTime() - data[0];

    /* spsave 3.x: online addin only series */
    return Promise.all([new Date().getTime(), saveFilesArraySeries(filesToSave, coreOnlineOptions, onlineAddinOnlyCreds)]);
  })
  .then(data => {
    spsaveOnlineAddinOnlyElapsedSeries = new Date().getTime() - data[0];

    /* spsave 3.x: online addin only parallel */
    return Promise.all([new Date().getTime(), saveFilesArrayInParallel(filesToSave, coreOnlineOptions, onlineAddinOnlyCreds)]);
  })
  .then(data => {
    spsaveOnlineAddinOnlyElapsedParallel = new Date().getTime() - data[0];

    /* spsave 3.x: adfs parallel */
    return Promise.all([new Date().getTime(), saveFilesArrayInParallel(filesToSave, coreAdfsOnPremOptions, adfsCreds)]);
  })
  .then(data => {
    adfsOnpremElapsedParallel = new Date().getTime() - data[0];

    /* spsave 3.x: adfs parallel */
    return Promise.all([new Date().getTime(), saveFilesArraySeries(filesToSave, coreAdfsOnPremOptions, adfsCreds)]);
  })
  .then(data => {
    adfsOnpremElapsedSeries = new Date().getTime() - data[0];

    return null;
  })
  .then(printResults)
  .catch(err => {
    console.log(err);
  });

function printResults(): void {
  console.log('');
  console.log('');
  console.log('');
  (<any>console).table(`${filesToSave.length} files upload: in series`, [
    {
      'spsave': 'spsave 1.x',
      'on-premise user creds': `${legacyOnPremElapsedSeries / 1000}s`,
      'on-premise addin only': '-',
      'online user creds': `${legacyOnlineElapsedSeries / 1000}s`,
      'online addin only': '-',
      'adfs (on premise)' : '-'
    },
    {
      'spsave': 'spsave 3.x',
      'on-premise user creds': `${spsaveOnPremElapsedSeries / 1000}s`,
      'on-premise addin only': `${spsaveOnpremiseAddinOnlyElapsedSeries / 1000}s`,
      'online user creds': `${spsaveOnlineElapsedSeries / 1000}s`,
      'online addin only': `${spsaveOnlineAddinOnlyElapsedSeries / 1000}s`,
      'adfs (on premise)' : `${adfsOnpremElapsedSeries / 1000}s`
    }
  ]);

  (<any>console).table(`${filesToSave.length} files upload: in parallel`, [
    {
      'spsave': 'spsave 1.x',
      'on-premise user creds': `${legacyOnPremElapsedParallel / 1000}s`,
      'on-premise addin only': '-',
      'online user creds': `${legacyOnlineElapsedParallel / 1000}s`,
      'online addin only': '-',
      'adfs (on premise)' : '-'
    },
    {
      'spsave': 'spsave 3.x',
      'on-premise user creds': `${spsaveOnPremElapsedParallel / 1000}s`,
      'on-premise addin only': `${spsaveOnpremiseAddinOnlyElapsedParallel / 1000}s`,
      'online user creds': `${spsaveOnlineElapsedParallel / 1000}s`,
      'online addin only': `${spsaveOnlineAddinOnlyElapsedParallel / 1000}s`,
      'adfs (on premise)' : `${adfsOnpremElapsedParallel / 1000}s`
    }
  ]);
}

function saveFilesArrayInParallelLegacy(files: string[], opts: any): Promise<any> {
  let promises: Promise<any>[] = [];

  files.forEach(file => {
    opts.fileName = path.basename(file);
    opts.fileContent = fs.readFileSync(file);
    opts.folder = folder;
    let newOptions: any = _.extend({}, opts);
    let deferred: IDeferred<any> = defer<any>();

    ((o) => {
      spsaveLegacy(o, (err: any, data: any) => {
        if (err) {
          deferred.reject(err);
          return;
        }
        deferred.resolve(null);
      });
    })(newOptions);
    promises.push(deferred.promise);
  });

  return Promise.all(promises);
}

function saveFilesArrayInParallel(files: string[], coreOptions: ICoreOptions, creds: IAuthOptions): Promise<any> {
  let promises: Promise<any>[] = [];

  files.forEach(file => {
    let fileOptions: FileOptions = {
      fileName: path.basename(file),
      fileContent: fs.readFileSync(file),
      folder: folder
    };

    promises.push(spsave(coreOptions, creds, fileOptions));
  });

  return Promise.all(promises);
}

function savesFileArraySeriesLegacy(files: string[], opts: any, deferred?: IDeferred<any>): Promise<any> {
  if (!deferred) {
    deferred = defer<any>();
  }

  if (files.length > 0) {

    opts.fileName = path.basename(files[0]);
    opts.fileContent = fs.readFileSync(files[0]);
    opts.folder = folder;

    spsaveLegacy(opts, (err: any, data: any) => {
      if (err) {
        deferred.reject(err);
        return;
      }
      savesFileArraySeriesLegacy(files.slice(1, files.length), opts, deferred);
    });
  } else {
    deferred.resolve(null);
  }

  return deferred.promise;
}

function saveFilesArraySeries(files: string[], coreOptions: ICoreOptions, creds: IAuthOptions, deferred?: IDeferred<any>): Promise<any> {
  if (!deferred) {
    deferred = defer<any>();
  }

  if (files.length > 0) {
    let file: FileOptions = {
      fileName: path.basename(files[0]),
      fileContent: fs.readFileSync(files[0]),
      folder: folder
    };

    spsave(coreOptions, creds, file)
      .then(() => {
        saveFilesArraySeries(files.slice(1, files.length), coreOptions, creds, deferred);
      })
      .catch(err => {
        deferred.reject(err);
      });
  } else {
    deferred.resolve(null);
  }

  return deferred.promise;
}
