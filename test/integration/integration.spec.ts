import { expect } from 'chai';
import * as fs from 'fs';
import * as Promise from 'bluebird';
import * as url from 'url';
import * as sprequest from 'sp-request';
import { ISPRequest } from 'sp-request';
let map: any = require('map-stream');
import * as vfs from 'vinyl-fs';
import File = require('vinyl');
import * as sinon from 'sinon';

import { spsave } from './../../src/core/SPSave';
import { CheckinType, FileOptions, ICoreOptions } from './../../src/core/SPSaveOptions';
import { UrlHelper } from './../../src/utils/UrlHelper';

let config: any = require('./config');

let tests: any[] = [
  {
    name: 'on-premise user credentials',
    creds: config.onpremCreds,
    url: config.onpremNtlmEnabledUrl
  },
  {
    name: 'on-premise addin only',
    creds: config.onpremAddinOnly,
    url: config.onpremAdfsEnabledUrl
  },
  {
    name: 'online user credentials',
    creds: config.onlineCreds,
    url: config.onlineUrl
  },
  {
    name: 'online addin only',
    creds: config.onlineAddinOnly,
    url: config.onlineUrl
  },
  {
    name: 'adfs user credentials',
    creds: config.adfsCredentials,
    url: config.onpremAdfsEnabledUrl
  }
];

let subFolder: string = 'SiteAssets/files/templates';

tests.forEach(test => {
  describe(`spsave: integration tests - ${test.name}`, () => {

    let spr: ISPRequest = sprequest.create(test.creds);

    beforeEach('delete folders', function (done: MochaDone): void {
      this.timeout(20 * 1000);

      spr.requestDigest(test.url)
        .then(digest => {
          return Promise.all([spr.post(`${test.url}/_api/web/GetFolderByServerRelativeUrl(@FolderName)` +
            `?@FolderName='${encodeURIComponent('SiteAssets/files')}'`, {
              headers: {
                'X-RequestDigest': digest,
                'X-HTTP-Method': 'DELETE'
              }
            })]);
        })
        .then(data => {
          done();
          return null;
        })
        .catch(done);
    });

    after('cleaning', function (done: MochaDone): void {
      this.timeout(20 * 1000);

      spr.requestDigest(test.url)
        .then(digest => {
          return Promise.all([spr.post(`${test.url}/_api/web/GetFolderByServerRelativeUrl(@FolderName)` +
            `?@FolderName='${encodeURIComponent('SiteAssets/files')}'`, {
              headers: {
                'X-RequestDigest': digest,
                'X-HTTP-Method': 'DELETE'
              }
            })]);
        })
        .then(data => {
          done();
          return null;
        })
        .catch(done);
    });

    let path: string = UrlHelper.removeTrailingSlash(url.parse(test.url).path);

    it('should upload binary file', function (done: MochaDone): void {
      this.timeout(20 * 1000);

      let fileName: string = 'sp.png';
      let fileContent: Buffer = fs.readFileSync(`test/integration/files/${fileName}`);
      let folder: string = 'SiteAssets/files';

      let files: FileOptions = {
        fileName: fileName,
        fileContent: fileContent,
        folder: folder
      };

      let core: ICoreOptions = {
        siteUrl: test.url
      };

      spsave(core, test.creds, files)
        .then(data => {
          let fileRelativeUrl: string = `${path}/${folder}/${fileName}`;
          return spr.get(`${core.siteUrl}/_api/web/GetFileByServerRelativeUrl(@FileUrl)/$value` +
            `?@FileUrl='${encodeURIComponent(fileRelativeUrl)}'`, {
              encoding: null
            });
        })
        .then(data => {
          expect(fileContent.equals(data.body)).is.true;
          done();
          return null;
        })
        .catch(done);
    });

    it('should upload text file', function (done: MochaDone): void {
      this.timeout(20 * 1000);

      let fileName: string = 'spsave.txt';
      let fileContent: Buffer = fs.readFileSync(`test/integration/files/${fileName}`);
      let folder: string = 'SiteAssets/files';

      let files: FileOptions = {
        fileName: fileName,
        fileContent: fileContent,
        folder: folder
      };

      let core: ICoreOptions = {
        siteUrl: test.url
      };

      spsave(core, test.creds, files)
        .then(data => {
          let fileRelativeUrl: string = `${path}/${folder}/${fileName}`;
          return spr.get(`${core.siteUrl}/_api/web/GetFileByServerRelativeUrl(@FileUrl)/$value` +
            `?@FileUrl='${encodeURIComponent(fileRelativeUrl)}'`, {
              encoding: null
            });
        })
        .then(data => {
          expect(fileContent.equals(data.body)).is.true;
          done();
          return null;
        })
        .catch(done);
    });

    it('should create folders before uploading the file', function (done: MochaDone): void {
      this.timeout(20 * 1000);

      let fileName: string = 'sp.png';
      let fileContent: Buffer = fs.readFileSync(`test/integration/files/${fileName}`);

      let files: FileOptions = {
        fileName: fileName,
        fileContent: fileContent,
        folder: subFolder
      };

      let core: ICoreOptions = {
        siteUrl: test.url
      };

      let subFolderRestUrl: string = `${test.url}/_api/web/GetFolderByServerRelativeUrl(@FolderName)` +
        `?@FolderName='${encodeURIComponent(subFolder)}'`;

      spr.get(subFolderRestUrl)
        .then(data => {
          done(new Error('Folder should be deleted before running this test'));
        })
        .catch(err => {
          if (err.statusCode === 404 || err.statusCode === 500) { /* 500 for online */
            return spsave(core, test.creds, files);
          }
          done(new Error('Folder should be deleted before running this test'));
        })
        .then(data => {
          return spr.get(subFolderRestUrl);
        })
        .then(data => {
          expect(data.statusCode).to.equal(200);
          done();
          return null;
        })
        .catch(done);
    });

    it('should upload vinyl file', function (done: MochaDone): void {
      this.timeout(20 * 1000);

      let fileName: string = 'sp.png';
      let folder: string = 'SiteAssets/files';
      let fileContent: Buffer = fs.readFileSync(`test/integration/files/${fileName}`);

      vfs.src(`test/integration/files/${fileName}`)
        .pipe(map((file: File, cb: Function) => {

          let files: FileOptions = {
            file: file,
            folder: folder
          };

          let core: ICoreOptions = {
            siteUrl: test.url
          };

          spsave(core, test.creds, files)
            .then(data => {
              let fileRelativeUrl: string = `${path}/${folder}/${fileName}`;
              return spr.get(`${test.url}/_api/web/GetFileByServerRelativeUrl(@FileUrl)/$value` +
                `?@FileUrl='${encodeURIComponent(fileRelativeUrl)}'`, {
                  encoding: null
                });
            })
            .then(data => {
              expect(fileContent.equals(data.body)).is.true;
              done();
              return null;
            })
            .catch(done)
            .finally(() => {
              cb();
            });
        }));
    });

    it('should create subfolders when using vinyl file', function (done: MochaDone): void {
      this.timeout(20 * 1000);

      let fileName: string = 'sp.png';
      let folder: string = 'SiteAssets';
      let fileContent: Buffer = fs.readFileSync(`test/integration/files/${fileName}`);

      vfs.src(`test/integration/files/${fileName}`, { base: 'test/integration' })
        .pipe(map((file: File, cb: Function) => {
          let files: FileOptions = {
            file: file,
            folder: folder
          };

          let core: ICoreOptions = {
            siteUrl: test.url
          };

          spsave(core, test.creds, files)
            .then(data => {
              return spr.get(`${test.url}/_api/web/GetFileByServerRelativeUrl(@FileUrl)/$value` +
                `?@FileUrl='${encodeURIComponent(`${path}/SiteAssets/files/${fileName}`)}'`, {
                  encoding: null
                });
            })
            .then(data => {
              expect(fileContent.equals(data.body)).is.true;
              done();
              return null;
            })
            .catch(done)
            .finally(() => {
              cb();
            });
        }));
    });

    it('should upload all globs files', function (done: MochaDone): void {
      this.timeout(20 * 1000);

      let pngFile: Buffer = fs.readFileSync('test/integration/files/sp.png');
      let txtFile: Buffer = fs.readFileSync('test/integration/files/spsave.txt');

      let files: FileOptions = {
        glob: ['test/integration/files/*.*'],
        base: 'test/integration',
        folder: 'SiteAssets'
      };

      let core: ICoreOptions = {
        siteUrl: test.url
      };

      spsave(core, test.creds, files)
        .then(() => {
          return Promise.all([spr.get(`${test.url}/_api/web/GetFileByServerRelativeUrl(@FileUrl)/$value` +
            `?@FileUrl='${encodeURIComponent(`${path}/SiteAssets/files/sp.png`)}'`, {
              encoding: null
            }), spr.get(`${test.url}/_api/web/GetFileByServerRelativeUrl(@FileUrl)/$value` +
              `?@FileUrl='${encodeURIComponent(`${path}/SiteAssets/files/spsave.txt`)}'`, {
                encoding: null
              })]);
        })
        .then(data => {
          expect(pngFile.equals(data[0].body)).is.true;
          expect(txtFile.equals(data[1].body)).is.true;

          done();
          return null;
        })
        .catch(done);
    });

    it('should checkin with appropriate comment', function (done: MochaDone): void {
      this.timeout(20 * 1000);

      let fileName: string = 'sp.png';
      let fileContent: Buffer = fs.readFileSync(`test/integration/files/${fileName}`);
      let folder: string = 'SiteAssets/files';
      let comment: string = 'spsave testing';

      let files: FileOptions = {
        fileName: fileName,
        fileContent: fileContent,
        folder: folder
      };

      let core: ICoreOptions = {
        siteUrl: test.url,
        checkin: true,
        checkinMessage: comment
      };

      spsave(core, test.creds, files)
        .then(data => {
          let fileRelativeUrl: string = `${path}/${folder}/${fileName}`;
          return spr.get(`${core.siteUrl}/_api/web/GetFileByServerRelativeUrl(@FileUrl)` +
            `?@FileUrl='${encodeURIComponent(fileRelativeUrl)}'`, {
              encoding: null
            });
        })
        .then(data => {
          expect(data.body.d.CheckInComment).to.equal(comment);
          done();
          return null;
        })
        .catch(done);
    });

    it('should create new minor version', function (done: MochaDone): void {
      this.timeout(20 * 1000);

      let fileName: string = 'sp.png';
      let fileContent: Buffer = fs.readFileSync(`test/integration/files/${fileName}`);
      let folder: string = 'SiteAssets/files';
      let fileRelativeUrl: string = `${path}/${folder}/${fileName}`;

      let files: FileOptions = {
        fileName: fileName,
        fileContent: fileContent,
        folder: folder
      };

      let core: ICoreOptions = {
        siteUrl: test.url,
        checkin: true,
        checkinMessage: 'spsave testing',
        checkinType: CheckinType.minor
      };

      spsave(core, test.creds, files)
        .then(data => {

          return spr.get(`${core.siteUrl}/_api/web/GetFileByServerRelativeUrl(@FileUrl)` +
            `?@FileUrl='${encodeURIComponent(fileRelativeUrl)}'`, {
              encoding: null
            });
        })
        .then(data => {
          return Promise.all([data.body.d, spsave(core, test.creds, files)]);
        })
        .then(data => {
          return Promise.all([data[0], spr.get(`${core.siteUrl}/_api/web/GetFileByServerRelativeUrl(@FileUrl)` +
            `?@FileUrl='${encodeURIComponent(fileRelativeUrl)}'`, {
              encoding: null
            })]);
        })
        .then(data => {
          expect(data[0].MinorVersion + 1).to.equal(data[1].body.d.MinorVersion);
          done();
          return null;
        })
        .catch(done);
    });

    it('should create new major version', function (done: MochaDone): void {
      this.timeout(20 * 1000);

      let fileName: string = 'sp.png';
      let fileContent: Buffer = fs.readFileSync(`test/integration/files/${fileName}`);
      let folder: string = 'SiteAssets/files';
      let fileRelativeUrl: string = `${path}/${folder}/${fileName}`;

      let files: FileOptions = {
        fileName: fileName,
        fileContent: fileContent,
        folder: folder
      };

      let core: ICoreOptions = {
        siteUrl: test.url,
        checkin: true,
        checkinMessage: 'spsave testing',
        checkinType: CheckinType.major
      };

      spsave(core, test.creds, files)
        .then(data => {

          return spr.get(`${core.siteUrl}/_api/web/GetFileByServerRelativeUrl(@FileUrl)` +
            `?@FileUrl='${encodeURIComponent(fileRelativeUrl)}'`, {
              encoding: null
            });
        })
        .then(data => {
          return Promise.all([data.body.d, spsave(core, test.creds, files)]);
        })
        .then(data => {
          return Promise.all([data[0], spr.get(`${core.siteUrl}/_api/web/GetFileByServerRelativeUrl(@FileUrl)` +
            `?@FileUrl='${encodeURIComponent(fileRelativeUrl)}'`, {
              encoding: null
            })]);
        })
        .then(data => {
          expect(data[0].MajorVersion + 1).to.equal(data[1].body.d.MajorVersion);
          done();
          return null;
        })
        .catch(done);
    });

    it('should overwrite current version', function (done: MochaDone): void {
      this.timeout(20 * 1000);

      let fileName: string = 'sp.png';
      let fileContent: Buffer = fs.readFileSync(`test/integration/files/${fileName}`);
      let folder: string = 'SiteAssets/files';
      let fileRelativeUrl: string = `${path}/${folder}/${fileName}`;

      let files: FileOptions = {
        fileName: fileName,
        fileContent: fileContent,
        folder: folder
      };

      let core: ICoreOptions = {
        siteUrl: test.url,
        checkin: true,
        checkinMessage: 'spsave testing',
        checkinType: CheckinType.overwrite
      };

      spsave(core, test.creds, files)
        .then(data => {

          return spr.get(`${core.siteUrl}/_api/web/GetFileByServerRelativeUrl(@FileUrl)` +
            `?@FileUrl='${encodeURIComponent(fileRelativeUrl)}'`, {
              encoding: null
            });
        })
        .then(data => {
          return Promise.all([data.body.d, spsave(core, test.creds, files)]);
        })
        .then(data => {
          return Promise.all([data[0], spr.get(`${core.siteUrl}/_api/web/GetFileByServerRelativeUrl(@FileUrl)` +
            `?@FileUrl='${encodeURIComponent(fileRelativeUrl)}'`, {
              encoding: null
            })]);
        })
        .then(data => {
          expect(data[0].MajorVersion).to.equal(data[1].body.d.MajorVersion);
          expect(data[0].MinorVersion).to.equal(data[1].body.d.MinorVersion);
          done();
          return null;
        })
        .catch(done);
    });

    it('should update file metadata', function (done: MochaDone): void {
      this.timeout(20 * 1000);

      let fileName: string = 'spsave.txt';
      let fileContent: Buffer = fs.readFileSync(`test/integration/files/${fileName}`);
      let folder: string = 'SiteAssets/files';
      let title: string = 'updated by spsave';

      let files: FileOptions = {
        fileName: fileName,
        fileContent: fileContent,
        folder: folder
      };

      let core: ICoreOptions = {
        siteUrl: test.url,
        filesMetaData: [{
          fileName: fileName,
          metadata: {
            '__metadata': { type: 'SP.Data.SiteAssetsItem' },
            Title: title
          }
        }]
      };

      spsave(core, test.creds, files)
        .then(data => {
          let fileRelativeUrl: string = `${path}/${folder}/${fileName}`;
          return spr.get(`${core.siteUrl}/_api/web/GetFileByServerRelativeUrl(@FileUrl)/ListItemAllFields` +
            `?@FileUrl='${encodeURIComponent(fileRelativeUrl)}'`);
        })
        .then(data => {
          expect(data.body.d.Title).to.equal(title);
          expect(core.filesMetaData[0].updated).is.true;
          done();
          return null;
        })
        .catch(done);
    });

    it('should update file metadata for display template', function (done: MochaDone): void {
      this.timeout(20 * 1000);

      let fileName: string = 'SPSave.js';
      let fileContent: Buffer = fs.readFileSync(`lib/src/core/${fileName}`);
      let folder: string = '_catalogs/masterpage/Display Templates/Search';

      let files: FileOptions = {
        fileName: fileName,
        fileContent: fileContent,
        folder: folder
      };

      let core: ICoreOptions = {
        siteUrl: test.url,
        filesMetaData: [{
          fileName: fileName,
          metadata: {
            '__metadata': { type: 'SP.Data.OData__x005f_catalogs_x002f_masterpageItem' },
            Title: 'SPSave Display Template',
            DisplayTemplateLevel: 'Item',
            TargetControlType: {
              '__metadata': {
                'type': 'Collection(Edm.String)'
              },
              'results': [
                'SearchResults'
              ]
            },
            ManagedPropertyMapping: `'Title':'Title','Path':'Path','Description':'Description'`,
            ContentTypeId: '0x0101002039C03B61C64EC4A04F5361F38510660500A0383064C59087438E649B7323C95AF6',
            TemplateHidden: false
          }
        }]
      };

      spsave(core, test.creds, files)
        .then(data => {
          let fileRelativeUrl: string = `${path}/${folder}/${fileName}`;
          return spr.get(`${core.siteUrl}/_api/web/GetFileByServerRelativeUrl(@FileUrl)/ListItemAllFields` +
            `?@FileUrl='${encodeURIComponent(fileRelativeUrl)}'`);
        })
        .then(data => {
          expect(core.filesMetaData[0].updated).is.true;
          done();
          return null;
        })
        .catch(done);
    });

    it('should not upload empty file', function (done: MochaDone): void {
      this.timeout(20 * 1000);

      let consoleSpy: sinon.SinonStub = sinon.stub(console, 'log');

      let fileName: string = 'spsave.txt';
      let fileContent: string = '';
      let folder: string = 'SiteAssets/files';

      let files: FileOptions = {
        fileName: fileName,
        fileContent: fileContent,
        folder: folder
      };

      let core: ICoreOptions = {
        siteUrl: test.url
      };

      spsave(core, test.creds, files)
        .then(data => {
          consoleSpy.restore();
          let call: sinon.SinonSpyCall = consoleSpy.getCall(0);
          expect((<string>call.args[0]).indexOf('skipping')).not.to.equal(-1);

          done();
        })
        .catch(err => {
          consoleSpy.restore();
          done(err);
        });
    });
  });
});
