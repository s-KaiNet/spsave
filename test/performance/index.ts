import * as globby from 'globby';
import * as Promise from 'bluebird';
import * as path from 'path';
import * as fs from 'fs';
import * as _ from 'lodash';
require('console.table');

import {spsave} from './../../src/core/SPSave';
import {FileContentOptions, CoreOptions} from './../../src/core/SPSaveOptions';
import {defer, IDeferred} from './../../src/utils/Defer';

let config: any = require('./config');
let spsaveLegacy: any = require(path.resolve('test/performance/legacy/node_modules/spsave/lib/spsave.js'));

let filesToSave: string[] = globby.sync('test/performance/files/*.*');
let folder: string = 'SiteAssets/files';

let onPremOptions: CoreOptions = {
  username: config.onprem.username,
  password: config.onprem.password,
  domain: config.env.domain,
  siteUrl: config.url.onprem
};

let onlineOptions: CoreOptions = {
  username: config.online.username,
  password: config.online.password,
  domain: config.env.domain,
  siteUrl: config.url.online
};

let legacyOnPremElapsedSeries: number;
let spsaveOnPremElapsedSeries: number;
let legacyOnPremElapsedParallel: number;
let spsaveOnPremElapsedParallel: number;

let legacyOnlineElapsedSeries: number;
let spsaveOnlineElapsedSeries: number;
let legacyOnlineElapsedParallel: number;
let spsaveOnlineElapsedParallel: number;

/* legacy: on-premise series run */
Promise.all([new Date().getTime(), savesFileArraySeriesLegacy(filesToSave, onPremOptions)])
  .then((data) => {
    legacyOnPremElapsedSeries = new Date().getTime() - data[0];

    /* legacy: on-premise parallel run */
    return Promise.all([new Date().getTime(), saveFilesArrayInParallelLegacy(filesToSave, onPremOptions)]);
  })
  .then((data) => {
    legacyOnPremElapsedParallel = new Date().getTime() - data[0];

    /* legacy: online series run */
    return Promise.all([new Date().getTime(), savesFileArraySeriesLegacy(filesToSave, onlineOptions)]);
  })
  .then(data => {
    legacyOnlineElapsedSeries = new Date().getTime() - data[0];

    /* legacy: online parallel run */
    return Promise.all([new Date().getTime(), saveFilesArrayInParallelLegacy(filesToSave, onlineOptions)]);
  })
  .then(data => {
    legacyOnlineElapsedParallel = new Date().getTime() - data[0];

    /* spsave 2.x: on-premise parallel run */
    return Promise.all([new Date().getTime(), saveFilesArrayInParallel(filesToSave, onPremOptions)]);
  })
  .then((data) => {
    spsaveOnPremElapsedParallel = new Date().getTime() - data[0];

    /* spsave 2.x: on-premise series run */
    return Promise.all([new Date().getTime(), saveFilesArraySeries(filesToSave, <FileContentOptions>onPremOptions)]);
  })
  .then((data) => {
    spsaveOnPremElapsedSeries = new Date().getTime() - data[0];

    /* spsave 2.x: online parallel run */
    return Promise.all([new Date().getTime(), saveFilesArrayInParallel(filesToSave, onlineOptions)]);
  })
  .then(data => {
    spsaveOnlineElapsedParallel = new Date().getTime() - data[0];

    /* spsave 2.x: online series run */
    return Promise.all([new Date().getTime(), saveFilesArraySeries(filesToSave, <FileContentOptions>onlineOptions)]);
  })
  .then(data => {
    spsaveOnlineElapsedSeries = new Date().getTime() - data[0];
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
      'on-premise': `${legacyOnPremElapsedSeries / 1000}s`,
      'online': `${legacyOnlineElapsedSeries / 1000}s`
    },
    {
      'spsave': 'spsave 2.x',
      'on-premise': `${spsaveOnPremElapsedSeries / 1000}s`,
      'online': `${spsaveOnlineElapsedSeries / 1000}s`
    }
  ]);

  (<any>console).table(`${filesToSave.length} files upload: in parallel`, [
    {
      'spsave': 'spsave 1.x',
      'on-premise': `${legacyOnPremElapsedParallel / 1000}s`,
      'online': `${legacyOnlineElapsedParallel / 1000}s`
    },
    {
      'spsave': 'spsave 2.x',
      'on-premise': `${spsaveOnPremElapsedParallel / 1000}s`,
      'online': `${spsaveOnlineElapsedParallel / 1000}s`
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

function saveFilesArrayInParallel(files: string[], opts: any): Promise<any> {
  let promises: Promise<any>[] = [];

  files.forEach(file => {
    opts.fileName = path.basename(file);
    opts.fileContent = fs.readFileSync(file);
    opts.folder = folder;
    promises.push(spsave(opts));
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

function saveFilesArraySeries(files: string[], opts: FileContentOptions, deferred?: IDeferred<any>): Promise<any> {
  if (!deferred) {
    deferred = defer<any>();
  }

  if (files.length > 0) {

    opts.fileName = path.basename(files[0]);
    opts.fileContent = fs.readFileSync(files[0]);
    opts.folder = folder;

    spsave(opts)
      .then(() => {
        saveFilesArraySeries(files.slice(1, files.length), opts, deferred);
      })
      .catch(err => {
        deferred.reject(err);
      });
  } else {
    deferred.resolve(null);
  }

  return deferred.promise;
}
