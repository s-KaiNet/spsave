import * as Promise from 'bluebird';
import * as notifier from 'node-notifier';
import * as path from 'path';

import {SPSaveOptions, FileContentOptions} from './SPSaveOptions';
import {FileSaver} from './FileSaver';
import {ILogger} from './../utils/ILogger';
import {ConsoleLogger} from './../utils/ConsoleLogger';
import {OptionsParser} from './../utils/OptionsParser';
import {defer, IDeferred} from './../utils/Defer';

Promise.longStackTraces();

let logger: ILogger = new ConsoleLogger();

export function spsave(options: SPSaveOptions): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    let saveOptions: FileContentOptions[] = OptionsParser.parseOptions(options);
    let showNotification: () => void = () => {
      if (!options.notification) {
        return;
      }

      notifier.notify({
        title: `spsave: ${saveOptions.length} file(s) uploaded`,
        message: saveOptions.map((o) => { return o.fileName; }).join(', '),
        icon: path.join(__dirname, '../../../assets/sp.png')
      });
    };

    if (saveOptions.length > 1) {
      saveFileArray(saveOptions).then((data) => {
        showNotification();
        resolve(data);

        return null;
      })
        .catch(err => {
          showError(err, options.notification);
          reject(err);
        });
    } else if (saveOptions.length === 1) {
      saveSingleFile(saveOptions[0]).then((data) => {
        showNotification();
        resolve(data);

        return null;
      })
        .catch(err => {
          showError(err, options.notification);
          reject(err);
        });
    }
  });
}

function saveFileArray(options: FileContentOptions[], deferred?: IDeferred<any>): Promise<any> {
  if (!deferred) {
    deferred = defer<any>();
  }

  if (options.length > 0) {
    saveSingleFile(options[0])
      .then(() => {
        saveFileArray(options.slice(1, options.length), deferred);

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

function saveSingleFile(options: FileContentOptions): Promise<any> {
  return new FileSaver(options).save();
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
