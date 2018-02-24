import * as Promise from 'bluebird';
import * as notifier from 'node-notifier';
import * as path from 'path';
import {IAuthOptions} from 'sp-request';

import {
  ICoreOptions,
  FileOptions,
  ISPSaveOptions
} from './SPSaveOptions';
import {FileSaver} from './FileSaver';
import {ILogger} from './../utils/ILogger';
import {ConsoleLogger} from './../utils/ConsoleLogger';
import {FileOptionsParser} from './../utils/FileOptionsParser';
import {defer, IDeferred} from './../utils/Defer';

Promise.longStackTraces();

let logger: ILogger = new ConsoleLogger();

export function spsave(coreOptions: ICoreOptions, credentialOptions: IAuthOptions, fileOptions: FileOptions): Promise<any> {
  return new Promise<any>((resolve, reject) => {

    let spSaveOptions: ISPSaveOptions = {
      creds: credentialOptions,
      core: coreOptions,
      files: FileOptionsParser.parseOptions(fileOptions)
    };
    let showNotification: () => void = () => {
      if (!coreOptions.notification) {
        return;
      }

      notifier.notify({
        title: `spsave: ${spSaveOptions.files.length} file(s) uploaded`,
        message: spSaveOptions.files.map((o) => { return o.fileName; }).join(', '),
        icon: path.join(__dirname, '../../../assets/sp.png')
      });
    };

    if (spSaveOptions.files.length > 1) {
      saveFileArray(spSaveOptions).then((data) => {
        showNotification();
        resolve(data);

        return null;
      })
        .catch(err => {
          showError(err, coreOptions.notification);
          reject(err);
        });
    } else if (spSaveOptions.files.length === 1) {
      saveSingleFile(spSaveOptions).then((data) => {
        showNotification();
        resolve(data);

        return null;
      })
        .catch(err => {
          showError(err, coreOptions.notification);
          reject(err);
        });
    } else {
      reject({
        message: 'No files were uploaded. No files were found which match your criteria.'
      });
    }
  });
}

function saveFileArray(opts: ISPSaveOptions, deferred?: IDeferred<any>): Promise<any> {
  if (!deferred) {
    deferred = defer<any>();
  }

  if (opts.files.length > 0) {
    saveSingleFile(opts)
      .then(() => {
        opts.files = opts.files.slice(1, opts.files.length);
        saveFileArray(opts, deferred);

        return null;
      })
      .catch(err => {
        deferred.reject(err);
      });
  } else {
    deferred.resolve(undefined);
  }

  return deferred.promise;
}

function saveSingleFile(opts: ISPSaveOptions): Promise<any> {
  return new FileSaver(opts.core, opts.creds, opts.files[0]).save();
}

function showError(err: any, notify: boolean): void {

  if (notify) {
    notifier.notify({
      title: 'spsave: error occured',
      message: 'For details see console log',
      icon: path.join(__dirname, '../../../assets/sp_error.png')
    });
  }

  if (!err || !err.message) {
    logger.error('Unknown error occured');
    if (err && err.stack) {
      logger.info('');
      logger.info('Stack trace:');
      logger.info('');
      logger.error(err.stack);
    }
    return;
  }

  logger.error('Error occured:');

  if (err.message) {
    logger.error(err.message);
  }

  if (err.stack) {
    logger.info('');
    logger.info('Stack trace:');
    logger.info('');
    logger.error(err.stack);
  }
}
