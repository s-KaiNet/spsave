import * as Promise from 'bluebird';
import * as notifier from 'node-notifier';

import {SPSaveOptions, FileContentOptions, isFileContentOptions} from './ISPSaveOptions';
import {FileSaver} from './FileSaver';
import {ILogger} from './../utils/ILogger';
import {ConsoleLogger} from './../utils/ConsoleLogger';
import {OptionsParser} from './../utils/OptionsParser';

Promise.longStackTraces();

let logger: ILogger = new ConsoleLogger();

export function spsave(options: SPSaveOptions): Promise<any> {

  let showNotification: (message: string, title?: string) => void = (message: string, title?: string) => {
    if (options.notification) {
      notifier.notify({
        title: title || 'spsave',
        message: message
      });
    }
  };

  let saveOptions: FileContentOptions | FileContentOptions[] = OptionsParser.parseOptions(options);
  let savePromise: Promise<any>;

  if (saveOptions instanceof Array && saveOptions.length > 1) {
    savePromise = saveFileArray(saveOptions);

    savePromise.then(() => {
      showNotification(`${saveOptions.length} files successfully uploaded`);
    });
  } else if (saveOptions instanceof Array && saveOptions.length === 1) {
    savePromise = saveSingleFile(saveOptions[0]);
    savePromise.then(() => {
      showNotification(`Successfully uploaded`, `spsave: ${saveOptions[0].fileName}`);
    });
  } else if (isFileContentOptions(saveOptions)) {
    savePromise = saveSingleFile(saveOptions);
    savePromise.then(() => {
      showNotification(`Successfully uploaded`, `spsave: ${saveOptions.fileName}`);
    });
  }

  savePromise.catch(err => {
    showError(err, options.notification);
  });

  return savePromise;
}

function saveFileArray(options: FileContentOptions[], deferred?: Promise.Resolver<any>): Promise<any> {
  if (!deferred) {
    deferred = Promise.defer<any>();
  }

  if (options.length > 0) {
    saveSingleFile(options[0])
      .then(() => {
        saveFileArray(options.slice(1, options.length), deferred);
      })
      .catch(err => {
        deferred.reject(err);
      });
  } else {
    deferred.resolve();
  }

  return deferred.promise;
}

function saveSingleFile(options: FileContentOptions): Promise<any> {
  return new FileSaver(options).execute();
}

function showError(err: any, notify: boolean): void {

  if (notify) {
    notifier.notify({
      title: 'spsave: ERROR',
      message: 'See details under console window'
    });
  }

  if (!err) {
    logger.error('Unknown error occured');
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
