import * as Promise from 'bluebird';

import {SPSaveOptions, isFileContentOptions} from './ISPSaveOptions';
import {FileSaver} from './FileSaver';

Promise.longStackTraces();

export function spsave(options: SPSaveOptions): Promise<any> {
  if (isFileContentOptions(options)) {
    return new FileSaver(options).execute();
  }
}

