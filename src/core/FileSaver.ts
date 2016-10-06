import * as Promise from 'bluebird';
import * as sprequest from 'sp-request';
import {ISPRequest} from 'sp-request';
import * as url from 'url';
import * as _ from 'lodash';
import {IAuthOptions} from 'sp-request';

import {
  ICoreOptions,
  IFileContentOptions,
  CheckinType,
  IFileMetaData
} from './SPSaveOptions';
import {UrlHelper} from './../utils/UrlHelper';
import {FoldersCreator} from './../utils/FoldersCreator';
import {ILogger} from './../utils/ILogger';
import {ConsoleLogger} from './../utils/ConsoleLogger';
import {defer, IDeferred} from './../utils/Defer';

export class FileSaver {
  private static saveConfilctCode: string = '-2130246326';
  private static cobaltCode: string = '-1597308888';
  private static directoryNotFoundCode: string = '-2147024893';
  private static fileDoesNotExistOnpremCode: string = '-2146232832';
  private static fileDoesNotExistOnlineCode: string = '-2130575338';
  private static reUploadTimeout: number = 1500;
  private static maxAttempts: number = 3;

  private sprequest: ISPRequest;
  private uploadFileRestUrl: string;
  private getFileRestUrl: string;
  private checkoutFileRestUrl: string;
  private checkinFileRestUrl: string;
  private updateMetaDataRestUrl: string;
  private path: string;
  private foldersCreator: FoldersCreator;
  private logger: ILogger;
  private coreOptions: ICoreOptions;
  private file: IFileContentOptions;

  constructor(coreOptions: ICoreOptions, credentialOptions: IAuthOptions, fileOptions: IFileContentOptions) {
    this.sprequest = sprequest.create(credentialOptions);

    this.file = _.assign<{}, IFileContentOptions>({}, fileOptions);
    this.coreOptions = _.assign<{}, ICoreOptions>({}, coreOptions);

    _.defaults<ICoreOptions>(this.coreOptions, {
      checkin: false,
      checkinType: CheckinType.minor,
      checkinMessage: 'Checked in by spsave'
    });

    this.coreOptions.siteUrl = UrlHelper.removeTrailingSlash(this.coreOptions.siteUrl);
    this.file.folder = UrlHelper.trimSlashes(this.file.folder);
    this.path = UrlHelper.removeTrailingSlash(url.parse(this.coreOptions.siteUrl).path);

    this.foldersCreator = new FoldersCreator(this.sprequest, this.file.folder, this.coreOptions.siteUrl);
    this.logger = new ConsoleLogger();

    this.buildRestUrls();
  }

  public save(): Promise<any> {
    let deferred: IDeferred<any> = defer<any>();
    if (typeof this.file.fileContent === 'string' && Buffer.byteLength(<string>this.file.fileContent) === 0) {
      this.skipUpload(deferred);
    } else if (this.file.fileContent.length === 0) {
      this.skipUpload(deferred);
    } else {
      this.saveFile(deferred);
    }

    return deferred.promise;
  }

  /* saves file in a folder. If save conflict or cobalt error is thrown, tries to reupload file `maxAttempts` times */
  private saveFile(requestDeferred: IDeferred<any>, attempts: number = 1): void {

    if (attempts > FileSaver.maxAttempts) {
      let message: string = `File '${this.file.fileName}' probably is not uploaded: too many errors. Upload process interrupted.`;
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
          return this.sprequest.requestDigest(this.coreOptions.siteUrl);
        })
        .then(digest => {
          return this.sprequest.post(this.uploadFileRestUrl, {
            headers: {
              'X-RequestDigest': digest
            },
            body: this.file.fileContent,
            json: false
          });
        });

    Promise.all([checkoutResult, uploadResult])
      .then(result => {
        return this.updateMetaData(result);
      })
      .then(result => {
        let fileExists: boolean = result[0];
        let data: any = result[1];

        /* checkin file if checkin options presented */
        if (this.coreOptions.checkin && fileExists) {
          return this.checkinFile();
          /* if this is the first upload and we need to checkin the file, explicitly trigger checkin by uploading once again */
        } else if (this.coreOptions.checkin && !fileExists) {
          this.saveFile(requestDeferred, attempts + 1);

          return null;
        } else {
          this.logger.success(this.file.fileName + ` successfully uploaded to '${this.coreOptions.siteUrl}/${this.file.folder}'`);
        }

        requestDeferred.resolve(JSON.parse(data.body));

        return null;
      }).then(data => {
        if (!data) {
          return;
        }

        if (requestDeferred.promise.isPending()) {
          this.logger.success(this.file.fileName +
            ` successfully uploaded to '${this.coreOptions.siteUrl}/${this.file.folder}' and checked in.` +
            ` Checkin type: ${CheckinType[this.coreOptions.checkinType]}`);

          requestDeferred.resolve(data.body);
        }
      })
      .catch(err => {
        if (err && (err.statusCode === 500 || err.statusCode === 409)) { /* save conflict or cobalt error */
          this.tryReUpload(err, requestDeferred, attempts);
          return;
        }
        /* folder doesn't exist, create and reupload */
        if (err && err.statusCode === 404 && err.message && err.message.indexOf(FileSaver.directoryNotFoundCode) !== -1) {
          this.foldersCreator.createFoldersHierarchy()
            .then(() => {
              this.saveFile(requestDeferred, attempts + 1);
              return null;
            })
            .catch(folderError => {
              requestDeferred.reject(folderError);
            });
          return;
        }

        requestDeferred.reject(err);
      });
  }

  private skipUpload(deferred: IDeferred<any>): void {
    this.logger.warning(`File '${this.file.fileName}': skipping, file content is empty.`);
    deferred.resolve(true);
  }

  private updateMetaData(data: any): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      if (!this.coreOptions.filesMetaData || this.coreOptions.filesMetaData.length === 0) {
        resolve(data);
        return;
      }

      let fileMetaData: IFileMetaData = this.coreOptions.filesMetaData.filter(fileData => {
        return fileData.fileName === this.file.fileName;
      })[0];

      if (!fileMetaData || fileMetaData.updated) {
        resolve(data);
        return;
      }

      this.sprequest.requestDigest(this.coreOptions.siteUrl)
        .then(digest => {
          return this.sprequest.post(this.updateMetaDataRestUrl, {
            headers: {
              'X-RequestDigest': digest,
              'IF-MATCH': '*',
              'X-HTTP-Method': 'MERGE'
            },
            body: fileMetaData.metadata
          });
        })
        .then(() => {
          fileMetaData.updated = true;
          resolve(data);

          return null;
        })
        .catch(reject);
    });
  }

  /* checkins files */
  private checkinFile(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.sprequest.requestDigest(this.coreOptions.siteUrl)
        .then(digest => {
          return this.sprequest.post(this.checkinFileRestUrl, {
            headers: {
              'X-RequestDigest': digest
            }
          });
        })
        .then(data => {
          resolve(data);

          return null;
        })
        .catch(reject);
    });
  }

  /* tries to checkout file. returns true if file exists or false if doesn't */
  private checkoutFile(): Promise<boolean> {
    let promise: Promise<any> = new Promise<any>((resolve, reject) => {
      /* if checkin option isn't provided, just resolve to true and return */
      if (!this.coreOptions.checkin) {
        resolve(true);
        return undefined;
      }

      this.getFileByUrl()
        .then(data => {
          /* if already checked out, resolve to true */
          if (data.body.d.CheckOutType === 0) {
            resolve(true);
            return null;
          }

          /* not checked out yet, so checkout */
          return this.sprequest.requestDigest(this.coreOptions.siteUrl)
            .then(digest => {
              return this.sprequest.post(this.checkoutFileRestUrl, {
                headers: {
                  'X-RequestDigest': digest
                }
              });
            });
        }, err => {
          /* file doesn't exist message code, resolve with false */
          if (err.message.indexOf(FileSaver.fileDoesNotExistOnpremCode) !== -1 ||
            err.message.indexOf(FileSaver.fileDoesNotExistOnlineCode) !== -1) {
            resolve(false);

            return null;
          }
          reject(err);

          return null;
        })
        .then(data => {
          if (promise.isPending()) {
            this.logger.info(`${this.file.fileName} checked out.`);
            resolve(true);
          }

          return null;
        })
        .catch(reject);
    });

    return promise;
  }

  private getFileByUrl(): Promise<any> {
    return this.sprequest.get(this.getFileRestUrl);
  }

  /* check if error is save conflict or cobalt error and tries to reupload the file, otherwise reject deferred */
  private tryReUpload(exception: any, deferred: IDeferred<any>, attempts: number): void {
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
        this.logger.warning(`Save conflict detected for file '${this.file.fileName}'. Trying to re-upload...`);
        reUpload();
      } else if (errorData.error.code && errorData.error.code.indexOf(FileSaver.cobaltCode) === 0) {
        this.logger.warning(`Cobalt error detected for file '${this.file.fileName}'. Trying to re-upload...`);
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
    let fileServerRelativeUrl: string = `${this.path}/${this.file.folder}/${this.file.fileName}`;

    this.uploadFileRestUrl = this.coreOptions.siteUrl +
      '/_api/web/GetFolderByServerRelativeUrl(@FolderName)/Files/add(url=@FileName,overwrite=true)' +
      `?@FolderName='${encodeURIComponent(this.file.folder)}'&@FileName='${encodeURIComponent(this.file.fileName)}'`;

    this.getFileRestUrl = this.coreOptions.siteUrl + '/_api/web/GetFileByServerRelativeUrl(@FileUrl)' +
      `?@FileUrl='${encodeURIComponent(fileServerRelativeUrl)}'`;

    this.checkoutFileRestUrl = this.coreOptions.siteUrl + '/_api/web/GetFileByServerRelativeUrl(@FileUrl)/CheckOut()' +
      `?@FileUrl='${encodeURIComponent(fileServerRelativeUrl)}'`;

    this.checkinFileRestUrl = this.coreOptions.siteUrl +
      '/_api/web/GetFileByServerRelativeUrl(@FileUrl)/CheckIn(comment=@Comment,checkintype=@Type)' +
      `?@FileUrl='${encodeURIComponent(fileServerRelativeUrl)}'&@Comment='${(this.coreOptions.checkinMessage)}'` +
      `&@Type='${this.coreOptions.checkinType}'`;

    this.updateMetaDataRestUrl = this.coreOptions.siteUrl + '/_api/web/GetFileByServerRelativeUrl(@FileUrl)/ListItemAllFields' +
      `?@FileUrl='${encodeURIComponent(fileServerRelativeUrl)}'`;
  }
}
