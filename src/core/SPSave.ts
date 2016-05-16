import * as Promise from 'bluebird';
import * as sprequest from 'sp-request';

import {SPSaveOptions, FileContentOptions, isFileContentOptions} from './ISPSaveOptions';
import {FileSaver} from './FileSaver';

export function spsave(options: SPSaveOptions): Promise<any> {
  if (isFileContentOptions(options)) {
    return new FileSaver(options).execute();
  }
}

