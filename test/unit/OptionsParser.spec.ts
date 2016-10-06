import {expect} from 'chai';
import * as fs from 'fs';
let map: any = require('map-stream');
import * as vfs from 'vinyl-fs';
import File = require('vinyl');

import {FileOptionsParser} from './../../src/utils/FileOptionsParser';
import {FileOptions, IFileContentOptions} from './../../src/core/SPSaveOptions';

describe('spsave: OptionsParser test', () => {
  it('should return exact FileContentOptions', () => {
    let opts: FileOptions = {
      fileContent: 'spsave',
      folder: 'Assets',
      fileName: 'file.txt'
    };

    let fileOptions: IFileContentOptions[] = FileOptionsParser.parseOptions(opts);

    expect(fileOptions[0]).to.equal(opts);
  });

  it('should return undefined when fileContent not provided', () => {
    let opts: FileOptions = {
      fileContent: null,
      folder: 'Assets',
      fileName: 'file.txt'
    };

    let fileOptions: IFileContentOptions[] = FileOptionsParser.parseOptions(opts);

    expect(fileOptions).to.equal(undefined);
  });

  it('should return valid FileContentOptions with glob param', () => {
    let opts: FileOptions = {
      folder: 'Assets',
      glob: ['test/unit/tests.ts']
    };
    let expectedContent: Buffer = fs.readFileSync('test/unit/tests.ts');
    let fileOptions: IFileContentOptions[] = FileOptionsParser.parseOptions(opts);

    expect(fileOptions[0].fileContent).to.be.instanceOf(Buffer);
    expect(expectedContent.equals(<Buffer>fileOptions[0].fileContent)).is.true;
  });

  it('should return empty options', () => {
    let opts: FileOptions = {
      folder: 'Assets',
      glob: ['test/unit']
    };

    let fileOptions: IFileContentOptions[] = FileOptionsParser.parseOptions(opts);

    expect(fileOptions.length).to.equal(0);
  });

  it('should return valid FileContentOptions from vinyl file', (done) => {
    vfs.src(`test/unit/tests.ts`)
      .pipe(map((file: File, cb: Function) => {

        let opts: FileOptions = {
          folder: 'Assets',
          file: file
        };

        let fileOptions: IFileContentOptions[] = FileOptionsParser.parseOptions(opts);
        let expectedContent: Buffer = fs.readFileSync('test/unit/tests.ts');

        expect(fileOptions[0].fileContent).to.be.instanceOf(Buffer);
        expect(expectedContent.equals(<Buffer>fileOptions[0].fileContent)).is.true;
        done();
        cb();
      }));
  });

  it('should throw an error when folder option is empty', () => {
    let opts: FileOptions = {
      folder: '',
      glob: ['test/unit/tests.ts']
    };

    expect(() => {
      FileOptionsParser.parseOptions(opts);
    }).to.throw();
  });

  it('should throw an error when invalid base provided', () => {
    let opts: FileOptions = {
      folder: '',
      glob: ['test/unit/tests.ts'],
      base: 'unknown/test'
    };

    expect(() => {
      FileOptionsParser.parseOptions(opts);
    }).to.throw();
  });
});
