import {expect} from 'chai';
import * as Promise from 'bluebird';
import * as fs from 'fs';
import {IEnvironment, IUserCredentials} from 'sp-request';

import {spsave} from './../../src/core/SPSave';

import {FileContentOptions} from './../../src/core/ISPSaveOptions';

let config: any = require('./config');

let onprem: IUserCredentials = config.onprem;
let online: IUserCredentials = config.online;
let env: IEnvironment = config.env;
let url: any = config.url;

describe('spsave: integration - on-premise', () => {
  it('should save the file', (done) => {
    let opts: FileContentOptions = {
      username: onprem.username,
      password: onprem.password,
      domain: env.domain,
      siteUrl: url.onprem,
      fileName: 'file.txt',
      fileContent: "fs.readFileSync('./test/integration/file.docx')",
      folder: 'SiteAssets'
    };

    let save = (options: FileContentOptions): void => {
      spsave(options)
        .then(data => {
          //done();
        })
        .catch(err => {
          done(err);
        });
    };

    for (var i = 0; i < 9; i++) {
      save(opts);
    }

  });
});
