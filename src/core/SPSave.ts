import * as Promise from 'bluebird';
import * as sprequest from 'sp-request';

import {SPSaveOptions, FileContentOptions, isFileContentOptions} from './ISPSaveOptions';
import {SaveRequest} from './SaveRequest';

function spsave(options: SPSaveOptions): Promise<any> {
  if (isFileContentOptions(options)) {
    return new SaveRequest(options).execute();
  }
}

export = spsave;
