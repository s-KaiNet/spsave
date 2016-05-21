import {expect} from 'chai';
import * as fs from 'fs';
import * as Promise from 'bluebird';
import * as url from 'url';
import * as sprequest from 'sp-request';
import {ISPRequest} from 'sp-request';
let map: any = require('map-stream');
import * as vfs from 'vinyl-fs';
import File = require('vinyl');

import {spsave} from './../../src/core/SPSave';
import {FileContentOptions, VinylOptions, GlobOptions, CheckinType} from './../../src/core/ISPSaveOptions';
import {UrlHelper} from './../../src/utils/UrlHelper';

let config: any = require('./config');

let tests: any[] = [
  {
    name: 'on-premise',
    creds: config.onprem,
    env: config.env,
    url: config.url.onprem
  },
  {
    name: 'online',
    creds: config.online,
    env: {},
    url: config.url.online
  }
];

let subFolder: string = 'SiteAssets/files/templates';

tests.forEach(test => {
  describe(`spsave: integration tests - ${test.name}`, () => {

    let spr: ISPRequest = sprequest.create({ username: test.creds.username, password: test.creds.password }, { domain: test.env.domain });

    beforeEach('delete folders', function (done: MochaDone): void {
      this.timeout(10 * 1000);

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
        })
        .catch(done);
    });

    after('cleaning', function (done: MochaDone): void {
      this.timeout(10 * 1000);

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
        })
        .catch(done);
    });

    let path: string = UrlHelper.removeTrailingSlash(url.parse(test.url).path);

    it('should upload binary file', function (done: MochaDone): void {
      this.timeout(10 * 1000);

      let fileName: string = 'sp.png';
      let fileContent: Buffer = fs.readFileSync(`test/integration/files/${fileName}`);
      let folder: string = 'SiteAssets/files';

      let opts: FileContentOptions = {
        username: test.creds.username,
        password: test.creds.password,
        domain: test.env.domain,
        siteUrl: test.url,
        fileName: fileName,
        fileContent: fileContent,
        folder: folder
      };

      spsave(opts)
        .then(data => {
          let fileRelativeUrl: string = `${path}/${folder}/${fileName}`;
          return spr.get(`${opts.siteUrl}/_api/web/GetFileByServerRelativeUrl(@FileUrl)/$value` +
            `?@FileUrl='${encodeURIComponent(fileRelativeUrl)}'`, {
              encoding: null
            });
        })
        .then(data => {
          expect(fileContent.equals(data.body)).is.true;
          done();
        })
        .catch(done);
    });

    it('should upload text file', function (done: MochaDone): void {
      this.timeout(10 * 1000);

      let fileName: string = 'spsave.txt';
      let fileContent: Buffer = fs.readFileSync(`test/integration/files/${fileName}`);
      let folder: string = 'SiteAssets/files';

      let opts: FileContentOptions = {
        username: test.creds.username,
        password: test.creds.password,
        domain: test.env.domain,
        siteUrl: test.url,
        fileName: fileName,
        fileContent: fileContent,
        folder: folder
      };

      spsave(opts)
        .then(data => {
          let fileRelativeUrl: string = `${path}/${folder}/${fileName}`;
          return spr.get(`${opts.siteUrl}/_api/web/GetFileByServerRelativeUrl(@FileUrl)/$value` +
            `?@FileUrl='${encodeURIComponent(fileRelativeUrl)}'`, {
              encoding: null
            });
        })
        .then(data => {
          expect(fileContent.equals(data.body)).is.true;
          done();
        })
        .catch(done);
    });

    it('should create folders before uploading the file', function (done: MochaDone): void {
      this.timeout(10 * 1000);

      let fileName: string = 'sp.png';
      let fileContent: Buffer = fs.readFileSync(`test/integration/files/${fileName}`);

      let opts: FileContentOptions = {
        username: test.creds.username,
        password: test.creds.password,
        domain: test.env.domain,
        siteUrl: test.url,
        fileName: fileName,
        fileContent: fileContent,
        folder: subFolder
      };
      let subFolderRestUrl: string = `${test.url}/_api/web/GetFolderByServerRelativeUrl(@FolderName)` +
        `?@FolderName='${encodeURIComponent(subFolder)}'`;

      spr.get(subFolderRestUrl)
        .then(data => {
          done(new Error('Folder should be deleted before running this test'));
        })
        .catch(err => {
          if (err.statusCode === 404 || err.statusCode === 500) { /* 500 for online */
            return spsave(opts);
          }
          done(new Error('Folder should be deleted before running this test'));
        })
        .then(data => {
          return spr.get(subFolderRestUrl);
        })
        .then(data => {
          expect(data.statusCode).to.equal(200);
          done();
        })
        .catch(done);
    });

    it('should upload vinyl file', function (done: MochaDone): void {
      this.timeout(10 * 1000);

      let fileName: string = 'sp.png';
      let folder: string = 'SiteAssets/files';
      let fileContent: Buffer = fs.readFileSync(`test/integration/files/${fileName}`);

      vfs.src(`test/integration/files/${fileName}`)
        .pipe(map((file: File, cb: Function) => {
          spsave(<VinylOptions>{
            username: test.creds.username,
            password: test.creds.password,
            domain: test.env.domain,
            siteUrl: test.url,
            file: file,
            folder: folder
          })
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
            })
            .catch(done)
            .finally(() => {
              cb();
            });
        }));
    });

    it('should create subfolders when using vinyl file', function (done: MochaDone): void {
      this.timeout(10 * 1000);

      let fileName: string = 'sp.png';
      let folder: string = 'SiteAssets';
      let fileContent: Buffer = fs.readFileSync(`test/integration/files/${fileName}`);

      vfs.src(`test/integration/files/${fileName}`)
        .pipe(map((file: File, cb: Function) => {
          file.base = 'test/integration';
          spsave(<VinylOptions>{
            username: test.creds.username,
            password: test.creds.password,
            domain: test.env.domain,
            siteUrl: test.url,
            file: file,
            folder: folder
          })
            .then(data => {
              return spr.get(`${test.url}/_api/web/GetFileByServerRelativeUrl(@FileUrl)/$value` +
                `?@FileUrl='${encodeURIComponent(`${path}/SiteAssets/files/${fileName}`)}'`, {
                  encoding: null
                });
            })
            .then(data => {
              expect(fileContent.equals(data.body)).is.true;
              done();
            })
            .catch(done)
            .finally(() => {
              cb();
            });
        }));
    });

    it('should upload all globs files', function (done: MochaDone): void {
      this.timeout(10 * 1000);

      let pngFile: Buffer = fs.readFileSync('test/integration/files/sp.png');
      let txtFile: Buffer = fs.readFileSync('test/integration/files/spsave.txt');

      spsave(<GlobOptions>{
        username: test.creds.username,
        password: test.creds.password,
        domain: test.env.domain,
        siteUrl: test.url,
        glob: ['test/integration/files/*.*'],
        base: 'test/integration',
        folder: 'SiteAssets'
      })
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
        })
        .catch(done);
    });

    it('should checkin with appropriate comment', function (done: MochaDone): void {
      this.timeout(10 * 1000);

      let fileName: string = 'sp.png';
      let fileContent: Buffer = fs.readFileSync(`test/integration/files/${fileName}`);
      let folder: string = 'SiteAssets/files';
      let comment: string = 'spsave testing';

      let opts: FileContentOptions = {
        username: test.creds.username,
        password: test.creds.password,
        domain: test.env.domain,
        siteUrl: test.url,
        fileName: fileName,
        fileContent: fileContent,
        folder: folder,
        checkin: true,
        checkinMessage: comment
      };

      spsave(opts)
        .then(data => {
          let fileRelativeUrl: string = `${path}/${folder}/${fileName}`;
          return spr.get(`${opts.siteUrl}/_api/web/GetFileByServerRelativeUrl(@FileUrl)` +
            `?@FileUrl='${encodeURIComponent(fileRelativeUrl)}'`, {
              encoding: null
            });
        })
        .then(data => {
          expect(data.body.d.CheckInComment).to.equal(comment);
          done();
        })
        .catch(done);
    });

    it('should create new minor version', function (done: MochaDone): void {
      this.timeout(10 * 1000);

      let fileName: string = 'sp.png';
      let fileContent: Buffer = fs.readFileSync(`test/integration/files/${fileName}`);
      let folder: string = 'SiteAssets/files';
      let fileRelativeUrl: string = `${path}/${folder}/${fileName}`;

      let opts: FileContentOptions = {
        username: test.creds.username,
        password: test.creds.password,
        domain: test.env.domain,
        siteUrl: test.url,
        fileName: fileName,
        fileContent: fileContent,
        folder: folder,
        checkin: true,
        checkinMessage: 'spsave testing',
        checkinType: CheckinType.minor
      };

      spsave(opts)
        .then(data => {

          return spr.get(`${opts.siteUrl}/_api/web/GetFileByServerRelativeUrl(@FileUrl)` +
            `?@FileUrl='${encodeURIComponent(fileRelativeUrl)}'`, {
              encoding: null
            });
        })
        .then(data => {
          return Promise.all([data.body.d, spsave(opts)]);
        })
        .then(data =>  {
          return Promise.all([data[0], spr.get(`${opts.siteUrl}/_api/web/GetFileByServerRelativeUrl(@FileUrl)` +
            `?@FileUrl='${encodeURIComponent(fileRelativeUrl)}'`, {
              encoding: null
            })]);
        })
        .then(data => {
          expect(data[0].MinorVersion + 1).to.equal(data[1].body.d.MinorVersion);
          done();
        })
        .catch(done);
    });

    it('should create new major version', function (done: MochaDone): void {
      this.timeout(10 * 1000);

      let fileName: string = 'sp.png';
      let fileContent: Buffer = fs.readFileSync(`test/integration/files/${fileName}`);
      let folder: string = 'SiteAssets/files';
      let fileRelativeUrl: string = `${path}/${folder}/${fileName}`;

      let opts: FileContentOptions = {
        username: test.creds.username,
        password: test.creds.password,
        domain: test.env.domain,
        siteUrl: test.url,
        fileName: fileName,
        fileContent: fileContent,
        folder: folder,
        checkin: true,
        checkinMessage: 'spsave testing',
        checkinType: CheckinType.major
      };

      spsave(opts)
        .then(data => {

          return spr.get(`${opts.siteUrl}/_api/web/GetFileByServerRelativeUrl(@FileUrl)` +
            `?@FileUrl='${encodeURIComponent(fileRelativeUrl)}'`, {
              encoding: null
            });
        })
        .then(data => {
          return Promise.all([data.body.d, spsave(opts)]);
        })
        .then(data =>  {
          return Promise.all([data[0], spr.get(`${opts.siteUrl}/_api/web/GetFileByServerRelativeUrl(@FileUrl)` +
            `?@FileUrl='${encodeURIComponent(fileRelativeUrl)}'`, {
              encoding: null
            })]);
        })
        .then(data => {
          expect(data[0].MajorVersion + 1).to.equal(data[1].body.d.MajorVersion);
          done();
        })
        .catch(done);
    });

    it('should overwrite current version', function (done: MochaDone): void {
      this.timeout(10 * 1000);

      let fileName: string = 'sp.png';
      let fileContent: Buffer = fs.readFileSync(`test/integration/files/${fileName}`);
      let folder: string = 'SiteAssets/files';
      let fileRelativeUrl: string = `${path}/${folder}/${fileName}`;

      let opts: FileContentOptions = {
        username: test.creds.username,
        password: test.creds.password,
        domain: test.env.domain,
        siteUrl: test.url,
        fileName: fileName,
        fileContent: fileContent,
        folder: folder,
        checkin: true,
        checkinMessage: 'spsave testing',
        checkinType: CheckinType.overwrite
      };

      spsave(opts)
        .then(data => {

          return spr.get(`${opts.siteUrl}/_api/web/GetFileByServerRelativeUrl(@FileUrl)` +
            `?@FileUrl='${encodeURIComponent(fileRelativeUrl)}'`, {
              encoding: null
            });
        })
        .then(data => {
          return Promise.all([data.body.d, spsave(opts)]);
        })
        .then(data =>  {
          return Promise.all([data[0], spr.get(`${opts.siteUrl}/_api/web/GetFileByServerRelativeUrl(@FileUrl)` +
            `?@FileUrl='${encodeURIComponent(fileRelativeUrl)}'`, {
              encoding: null
            })]);
        })
        .then(data => {
          expect(data[0].MajorVersion).to.equal(data[1].body.d.MajorVersion);
          expect(data[0].MinorVersion).to.equal(data[1].body.d.MinorVersion);
          done();
        })
        .catch(done);
    });

  });
});
