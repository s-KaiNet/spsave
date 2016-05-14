import * as Promise from 'bluebird';
import * as sprequest from 'sp-request';
import {ISPRequest} from 'sp-request';

import {SPSaveOptions, FileContentOptions, isFileContentOptions} from './ISPSaveOptions';

export class SaveRequest {
  private sprequest: ISPRequest;

  constructor(private options: FileContentOptions) {
    this.sprequest = sprequest.create({ username: this.options.username, password: this.options.password },
      { domain: this.options.domain, workstation: this.options.workstation });
    this.options.siteUrl = this.options.siteUrl.replace(/\/$/, '');
  }

  public execute(): Promise<any> {
    let requestDeferred: Promise.Resolver<any> = Promise.defer<any>();

    let uploadRestUrl: string = '/_api/web/GetFolderByServerRelativeUrl(@FolderName)/Files/add(url=@FileName,overwrite=true)' +
    `?@FolderName='${encodeURIComponent(this.options.folder)}'&@FileName='${encodeURIComponent(this.options.fileName)}'`;

    this.sprequest.requestDigest(this.options.siteUrl)
      .then(digest => {
        return this.sprequest.post(`${this.options.siteUrl}${uploadRestUrl}`, {
          headers: {
            'X-RequestDigest': digest
          },
          body: this.options.fileContent,
          json: false
        });
      })
      .then(data => {
        requestDeferred.resolve(JSON.parse(data.body));
      })
      .catch((err: any) => {
        requestDeferred.reject(err);
      });

    return requestDeferred.promise;
  }
}
