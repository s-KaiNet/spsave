import * as Promise from 'bluebird';
import * as sprequest from 'sp-request';
import {ISPRequest} from 'sp-request';
import * as url from 'url';

import {FileContentOptions} from './ISPSaveOptions';
import {UrlHelper} from './../utils/UrlHelper';
import {FoldersCreator} from './../utils/FoldersCreator';
import {ILogger} from './../utils/ILogger';
import {ConsoleLogger} from './../utils/ConsoleLogger';

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
  private foldersCreator: FoldersCreator;
  private logger: ILogger;

  // TODO - logging for all failers

  constructor(private options: FileContentOptions) {
    this.sprequest = sprequest.create({ username: this.options.username, password: this.options.password },
      { domain: this.options.domain, workstation: this.options.workstation });

    this.options.siteUrl = UrlHelper.removeTrailingSlash(this.options.siteUrl);
    this.options.folder = UrlHelper.trimSlashes(this.options.folder);
    this.path = UrlHelper.removeTrailingSlash(url.parse(this.options.siteUrl).path);

    this.foldersCreator = new FoldersCreator(this.sprequest, this.options.folder, this.options.siteUrl);
    this.logger = new ConsoleLogger();

    this.buildRestUrls();
  }

  public execute(): Promise<any> {
    let requestDeferred: Promise.Resolver<any> = Promise.defer<any>();

    this.foldersCreator.createFoldersHierarchy()
      .then(() => {
        this.saveFile(requestDeferred);
      })
      .catch(err => {
        requestDeferred.reject(err);
      });

    return requestDeferred.promise;
  }

  /* saves file in a folder. If save conflict or cobalt error is thrown, tries to reupload file `maxAttempts` times */
  private saveFile(requestDeferred: Promise.Resolver<any>, attempts: number = 1): void {

    if (attempts > FileSaver.maxAttempts) {
      let message: string = `File '${this.options.fileName}' probably is not uploaded: too many errors. Upload process interrupted.`;
      this.logger.error(message);
      requestDeferred.reject(new Error(message));
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

      /* checkin file if checkin options presented */
      if (this.options.checkin && fileExists) {
        return this.checkinFile();
      } else {
        this.logger.success(this.options.fileName + ` successfully uploaded to url '${this.options.siteUrl}/${this.options.folder}'`);
      }

      requestDeferred.resolve(JSON.parse(data.body));
      return undefined;
    }).then(data => {
      if (requestDeferred.promise.isPending()) {
        this.logger.success(this.options.fileName +
          ` successfully uploaded to url '${this.options.siteUrl}/${this.options.folder}' and checked in.` +
          ` Checkin type: ${this.getCheckinTypeString(this.getCheckinType())}`);
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
          this.logger.info(`File ${this.options.fileName} checked out.`);
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

  private getCheckinTypeString(checkinType: number): string {
    switch (checkinType) {
      case 0:
        return 'minor';
      case 1:
        return 'major';
      case 2:
        return 'overwrite';
      default: return 'unknown';
    }
  }

  /* check if error is save conflict or cobalt error and tries to reupload the file, otherwise reject deferred */
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
        this.logger.warning(`Save conflict detected for file '${this.options.fileName}'. Trying to re-upload...`);
        reUpload();
      } else if (errorData.error.code && errorData.error.code.indexOf(FileSaver.cobaltCode) === 0) {
        this.logger.warning(`Cobalt error detected for file '${this.options.fileName}'. Trying to re-upload...`);
        reUpload();
      } else {
        this.logger.error(errorData.error);
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
