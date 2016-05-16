import * as Promise from 'bluebird';
import * as sprequest from 'sp-request';
import {ISPRequest} from 'sp-request';
import * as url from 'url';

import {FileContentOptions} from './ISPSaveOptions';
import {UrlHelper} from './UrlHelper';

export class FileSaver {
  private static saveConfilctCode: string = '-2130246326';
  private static cobaltCode: string = '-1597308888';
  private static checkinComment: string = 'Checked in by spsave';
  private static reUploadTimeout: number = 1500;
  private static maxAttempts: number = 3;

  private sprequest: ISPRequest;
  private uploadFileRestUrl: string;
  private getFileRestUrl: string;
  private checkoutFileRestUrl: string;
  private checkinFileRestUrl: string;
  private path: string;

  // TODO - logging for all failers

  constructor(private options: FileContentOptions) {
    this.sprequest = sprequest.create({ username: this.options.username, password: this.options.password },
      { domain: this.options.domain, workstation: this.options.workstation });
    this.options.siteUrl = UrlHelper.removeTrailingSlash(this.options.siteUrl);
    this.options.folder = UrlHelper.removeTrailingSlash(this.options.folder);
    this.path = UrlHelper.removeTrailingSlash(url.parse(this.options.siteUrl).path);

    this.buildRestUrls();
  }

  public execute(): Promise<any> {
    let requestDeferred: Promise.Resolver<any> = Promise.defer<any>();

    this.saveFile(requestDeferred);

    return requestDeferred.promise;
  }

  /* saves file in a fodler. If save conflict or cobalt error is thrown, tries to reupload file `maxAttempts` times */
  private saveFile(requestDeferred: Promise.Resolver<any>, attempts: number = 1): void {

    if (attempts > FileSaver.maxAttempts) {
      console.error(`File '${this.options.fileName}' probably is not uploaded. Too many errors.`);
      requestDeferred.reject(new Error('Too many errors. File upload process interrupted.'));
      return;
    }

    /* checkout file (only if option checkin provided) */

    let checkoutResult: Promise<boolean> = this.checkoutFile();

    let uploadResult: Promise<any> =
      checkoutResult
        .then(() => {
          /* upload file to folder */
          return this.sprequest.requestDigest(this.options.siteUrl)
            .then(digest => {
              return this.sprequest.post(this.uploadFileRestUrl, {
                headers: {
                  'X-RequestDigest': digest
                },
                body: this.options.fileContent,
                json: false
              });
            });
        });

    Promise.join(checkoutResult, uploadResult, (fileExists, data) => {

      /* checkin file */
      if (this.options.checkin && fileExists) {
        return this.checkinFile();
      } else {
        console.log(`File '${this.options.fileName}' successfully uploaded to folder '${this.options.folder}'`);
      }

      requestDeferred.resolve(JSON.parse(data.body));
      return undefined;
    }).then(data => {
      if (requestDeferred.promise.isPending()) {
        console.log(`File ${this.options.fileName} successfully uploaded to folder '${this.options.folder}' and checked in.`);
        requestDeferred.resolve(data);
      }
    })
      .catch(err => {
        if (err && (err.statusCode === 500 || err.statusCode === 409)) { /* save conflict or cobalt error */
          this.tryReUpload(err, requestDeferred, attempts);
          return;
        }

        requestDeferred.reject(err);
      });
  }

  /* checkins files */
  private checkinFile(): Promise<any> {
    let requestDeferred: Promise.Resolver<any> = Promise.defer<any>();

    this.sprequest.requestDigest(this.options.siteUrl)
      .then(digest => {
        return this.sprequest.post(this.checkinFileRestUrl, {
          headers: {
            'X-RequestDigest': digest
          }
        });
      })
      .then(data => {
        requestDeferred.resolve(data);
      })
      .catch(err => {
        requestDeferred.reject(err);
      });

    return requestDeferred.promise;
  }

  /* tries to checkout file. returns true if file exists or false if doesn't */
  private checkoutFile(): Promise<boolean> {
    let requestDeferred: Promise.Resolver<boolean> = Promise.defer<boolean>();

    /* if checkin option isn't provided, just resolve to true and return */
    if (!this.options.checkin) {
      requestDeferred.resolve(true);
      return requestDeferred.promise;
    }

    this.getFileByUrl()
      .then(data => {
        /* if already checked out, resolve to true */
        if (data.body.d.CheckOutType === 0) {
          requestDeferred.resolve(true);
          return undefined;
        }

        /* not checked out yet, so checkout */
        return this.sprequest.requestDigest(this.options.siteUrl)
          .then(digest => {
            return this.sprequest.post(this.checkoutFileRestUrl, {
              headers: {
                'X-RequestDigest': digest
              }
            });
          });
      }, err => {
        /* file doesn't exist message code, resolve with false */
        if (err.message.indexOf('-2146232832') !== 0) {
          requestDeferred.resolve(false);
          return undefined;
        }
        requestDeferred.reject(err);
        return undefined;
      })
      .then(data => {
        if (requestDeferred.promise.isPending()) {
          console.log(`File ${this.options.fileName} checked out.`);
          requestDeferred.resolve(true);
        }
      })
      .catch(err => {
        requestDeferred.reject(err);
      });

    return requestDeferred.promise;
  }

  private getFileByUrl(): Promise<any> {
    return this.sprequest.get(this.getFileRestUrl);
  }

  private getCheckinType(): number {
    let checkinType: number = 0;

    if (!this.options.checkinType) {
      return checkinType;
    }

    switch (this.options.checkinType) {
      case 'minor':
      case 0:
        checkinType = 0;
        break;
      case 'major':
      case 1:
        checkinType = 1;
        break;
      case 'overwrite':
      case 2:
        checkinType = 2;
        break;
      default:
        checkinType = 0;
        break;
    }

    return checkinType;
  }

  /* check if error is save conflict or cobalt and try to reupload the file, otherwise reject deferred */
  private tryReUpload(exception: any, deferred: Promise.Resolver<any>, attempts: number): void {
    let errorData: any;

    try {
      errorData = JSON.parse(exception.error);
    } catch (e) {
      deferred.reject(exception);
      return;
    }

    let reUpload: () => void = (): void => {
      setTimeout(() => {
        this.saveFile(deferred, attempts + 1);
      }, FileSaver.reUploadTimeout);
    };

    if (errorData.error) {
      if (errorData.error.code && errorData.error.code.indexOf(FileSaver.saveConfilctCode) === 0) {
        console.error(`Save conflict detected for file '${this.options.fileName}'. Trying to re-upload...`);
        reUpload();
      } else if (errorData.error.code && errorData.error.code.indexOf(FileSaver.cobaltCode) === 0) {
        console.error(`Cobalt error detected for file '${this.options.fileName}'. Trying to re-upload...`);
        reUpload();
      } else {
        console.error(errorData.error);
        deferred.reject(exception);
      }
    } else {
      deferred.reject(exception);
    }
  }

  private buildRestUrls(): void {
    let fileServerRelativeUrl: string = `${this.path}/${this.options.folder}/${this.options.fileName}`;

    this.uploadFileRestUrl = this.options.siteUrl +
      '/_api/web/GetFolderByServerRelativeUrl(@FolderName)/Files/add(url=@FileName,overwrite=true)' +
      `?@FolderName='${encodeURIComponent(this.options.folder)}'&@FileName='${encodeURIComponent(this.options.fileName)}'`;

    this.getFileRestUrl = this.options.siteUrl + '/_api/web/GetFileByServerRelativeUrl(@FileUrl)' +
      `?@FileUrl='${encodeURIComponent(fileServerRelativeUrl)}'`;

    this.checkoutFileRestUrl = this.options.siteUrl + '/_api/web/GetFileByServerRelativeUrl(@FileUrl)/CheckOut()' +
      `?@FileUrl='${encodeURIComponent(fileServerRelativeUrl)}'`;

    this.checkinFileRestUrl = this.options.siteUrl +
      '/_api/web/GetFileByServerRelativeUrl(@FileUrl)/CheckIn(comment=@Comment,checkintype=@Type)' +
      `?@FileUrl='${encodeURIComponent(fileServerRelativeUrl)}'&@Comment='${(FileSaver.checkinComment)}'` +
      `&@Type='${this.getCheckinType()}'`;
  }
}
