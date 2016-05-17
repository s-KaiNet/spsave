import {ISPRequest} from 'sp-request';
import * as Promise from 'bluebird';
import {Inspection} from 'bluebird';

import {UrlHelper} from './UrlHelper';
import {ILogger} from './ILogger';
import {ConsoleLogger} from './ConsoleLogger';

export class FoldersCreator {

  private getFolderRestUrlBase: string;
  private createFolderRestUrlBase: string;
  private logger: ILogger;

  constructor(private sprequest: ISPRequest, private folder: string, private siteUrl: string) {
    this.folder = UrlHelper.trimSlashes(folder);
    this.siteUrl = UrlHelper.removeTrailingSlash(siteUrl);

    this.getFolderRestUrlBase = this.siteUrl + '/_api/web/GetFolderByServerRelativeUrl(@FolderName)';
    this.createFolderRestUrlBase = this.siteUrl + '/_api/web/folders';

    this.logger = new ConsoleLogger();
  }

  public createFoldersHierarchy(): Promise<any> {
    let requestDeferred: Promise.Resolver<any> = Promise.defer<any>();

    let folderPaths: string[] = [];
    let paths: string[] = this.folder.split('/');

    this.createFoldersPathArray(paths, folderPaths);
    let getFolderPromises: Inspection<any>[] = [];
    folderPaths.forEach(folder => {
      let getFolderUrl: string = this.getFolderRestUrlBase + `?@FolderName='${encodeURIComponent(folder)}'`;
      getFolderPromises.push(this.sprequest.get(getFolderUrl).reflect());
    });

    Promise.all(getFolderPromises)
      .then(data => {
        let foldersToCreate: string[] = data.map((promise, index) => {
          if (promise.isRejected() && promise.reason().statusCode === 404) {
            return index;
          } else if (promise.isRejected()) {
            requestDeferred.reject(promise.reason());
          }
        }).filter(index => {
          return index !== undefined;
        }).map(index => {
          return folderPaths[index];
        });

        if (foldersToCreate.length > 0) {
          this.logger.info(`Creating folder or full folders hierarchy: '${this.folder}'`);
          this.createFolders(foldersToCreate)
            .then(() => {
              requestDeferred.resolve();
            })
            .catch(err => {
              requestDeferred.reject(err);
            });
        } else {
          requestDeferred.resolve();
        }
      });

    return requestDeferred.promise;
  }

  private createFolders(folders: string[], deferred?: Promise.Resolver<any>): Promise<any> {
    if (!deferred) {
      deferred = Promise.defer<any>();
    }

    if (folders.length > 0) {
      this.sprequest.requestDigest(this.siteUrl)
        .then(digest => {
          return this.sprequest.post(this.createFolderRestUrlBase, {
            body: {
              '__metadata': { 'type': 'SP.Folder' },
              'ServerRelativeUrl': `${folders[0]}`
            },
            headers: {
              'X-RequestDigest': digest
            }
          })
            .then(data => {
              this.createFolders(folders.slice(1, folders.length), deferred);
            })
            .catch(err => {
              deferred.reject(err);
            });
        });
    } else {
      deferred.resolve();
    }

    return deferred.promise;
  }

  private createFoldersPathArray(paths: string[], result: string[], index: number = 0): void {
    if (index === 0) {
      result.push(paths[index]);
    } else {
      result.push(`${result[index - 1]}/${paths[index]}`);
    }

    if (index === paths.length - 1) {
      return;
    }

    return this.createFoldersPathArray(paths, result, index + 1);
  }
}
