import {expect} from 'chai';
import * as fs from 'fs';
let map: any = require('map-stream');
import * as vfs from 'vinyl-fs';
import File = require('vinyl');

import {OptionsParser} from './../../src/utils/OptionsParser';
import {FileContentOptions, GlobOptions, VinylOptions} from './../../src/core/SPSaveOptions';

describe('spsave: OptionsParser test', () => {
  it('should return exact FileContentOptions', () => {
    let opts: FileContentOptions = {
      username: '',
      password: '',
      fileContent: 'spsave',
      folder: 'Assets',
      fileName: 'file.txt',
      siteUrl: 'http://sp.url'
    };

    let fileOptions: FileContentOptions[] = OptionsParser.parseOptions(opts);

    expect(fileOptions[0]).to.equal(opts);
  });

  it('should return undefined when fileContent not provided', () => {
    let opts: FileContentOptions = {
      username: '',
      password: '',
      fileContent: '',
      folder: 'Assets',
      fileName: 'file.txt',
      siteUrl: 'http://sp.url'
    };

    let fileOptions: FileContentOptions[] = OptionsParser.parseOptions(opts);

    expect(fileOptions).to.equal(undefined);
  });

  it('should return valid FileContentOptions with glob param', () => {
    let opts: GlobOptions = {
      username: '',
      password: '',
      folder: 'Assets',
      siteUrl: 'http://sp.url',
      glob: ['test/unit/tests.ts']
    };
    let expectedContent: Buffer = fs.readFileSync('test/unit/tests.ts');
    let fileOptions: FileContentOptions[] = OptionsParser.parseOptions(opts);

    expect(fileOptions[0].fileContent).to.be.instanceOf(Buffer);
    expect(expectedContent.equals(<Buffer>fileOptions[0].fileContent)).is.true;
  });

  it('should return empty options', () => {
    let opts: GlobOptions = {
      username: '',
      password: '',
      folder: 'Assets',
      siteUrl: 'http://sp.url',
      glob: ['test/unit']
    };

    let fileOptions: FileContentOptions[] = OptionsParser.parseOptions(opts);

    expect(fileOptions.length).to.equal(0);
  });

  it('should return valid FileContentOptions from vinyl file', (done) => {
    vfs.src(`test/unit/tests.ts`)
      .pipe(map((file: File, cb: Function) => {

        let opts: VinylOptions = {
          username: '',
          password: '',
          folder: 'Assets',
          siteUrl: 'http://sp.url',
          file: file
        };

        let fileOptions: FileContentOptions[] = OptionsParser.parseOptions(opts);
        let expectedContent: Buffer = fs.readFileSync('test/unit/tests.ts');

        expect(fileOptions[0].fileContent).to.be.instanceOf(Buffer);
        expect(expectedContent.equals(<Buffer>fileOptions[0].fileContent)).is.true;
        done();
        cb();
      }));
  });

  it('should throw an error when folder option is empty', () => {
    let opts: GlobOptions = {
      username: '',
      password: '',
      folder: '',
      siteUrl: 'http://sp.url',
      glob: ['test/unit/tests.ts']
    };

    expect(() => {
      OptionsParser.parseOptions(opts);
    }).to.throw();
  });

  it('should throw an error when invalid base provided', () => {
    let opts: GlobOptions = {
      username: '',
      password: '',
      folder: '',
      siteUrl: 'http://sp.url',
      glob: ['test/unit/tests.ts'],
      base: 'unknown/test'
    };

    expect(() => {
      OptionsParser.parseOptions(opts);
    }).to.throw();
  });
});
