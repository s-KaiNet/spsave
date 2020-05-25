import * as sprequest from 'sp-request';
import { ISPRequest } from 'sp-request';
import * as url from 'url';
import { IAuthOptions } from 'sp-request';

import {
  ICoreOptions,
  IFileContentOptions,
  CheckinType,
  IFileMetaData
} from './SPSaveOptions';
import { UrlHelper } from './../utils/UrlHelper';
import { FoldersCreator } from './../utils/FoldersCreator';
import { ILogger } from './../utils/ILogger';
import { ConsoleLogger } from './../utils/ConsoleLogger';
import { defer, IDeferred } from './../utils/Defer';

export class FileSaver {
  private static saveConfilctCode = '-2130246326';
  private static cobaltCode = '-1597308888';
  private static directoryNotFoundCode = '-2147024893';
  private static fileDoesNotExistOnpremCode = '-2146232832';
  private static fileDoesNotExistOnlineCode = '-2130575338';
  private static reUploadTimeout = 1500;
  private static maxAttempts = 3;

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

    this.file = Object.assign<any, IFileContentOptions>({}, fileOptions);
    this.coreOptions = Object.assign<any, ICoreOptions>({}, coreOptions);

    this.coreOptions = Object.assign<any, ICoreOptions>({
      checkin: false,
      checkinType: CheckinType.minor,
      checkinMessage: 'Checked in by spsave'
    }, this.coreOptions);

    this.coreOptions.siteUrl = UrlHelper.removeTrailingSlash(this.coreOptions.siteUrl);
    this.file.folder = UrlHelper.trimSlashes(this.file.folder);
    this.path = UrlHelper.removeTrailingSlash(url.parse(this.coreOptions.siteUrl).path);

    this.foldersCreator = new FoldersCreator(this.sprequest, this.file.folder, this.coreOptions.siteUrl);
    this.logger = new ConsoleLogger();

    this.buildRestUrls();
  }

  public save(): Promise<any> {
    const deferred: IDeferred<any> = defer<any>();
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
  private saveFile(requestDeferred: IDeferred<any>, attempts = 1): void {

    if (attempts > FileSaver.maxAttempts) {
      const message = `File '${this.file.fileName}' probably is not uploaded: too many errors. Upload process interrupted.`;
      this.logger.error(message);
      requestDeferred.reject(new Error(message));
      return;
    }

    /* checkout file (only if option checkin provided) */
    const checkoutResult: Promise<boolean> = this.checkoutFile();

    const uploadResult: Promise<any> =
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
            responseType: typeof this.file.fileContent === 'string' ? 'text' : 'buffer'
          });
        });

    Promise.all([checkoutResult, uploadResult])
      .then(result => {
        return this.updateMetaData(result);
      })
      .then(result => {
        const fileExists: boolean = result[0];
        const data: any = result[1];

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

        if (requestDeferred.isPending()) {
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

      const fileMetaData: IFileMetaData = this.coreOptions.filesMetaData.filter(fileData => {
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
    if (this.coreOptions.checkinType && this.coreOptions.checkinType == CheckinType.nocheckin) {
      return Promise.resolve(true);
    }

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
    const promise: Promise<any> = new Promise<any>((resolve, reject) => {
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
              })
                .then(() => {
                  this.logger.info(`${this.file.fileName} checked out.`);
                  resolve(true);
                  return null;
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

    const reUpload: () => void = (): void => {
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
    const fileServerRelativeUrl = `${this.path}/${this.file.folder}/${this.file.fileName}`;

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
