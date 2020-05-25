import {expect} from 'chai';
import * as fs from 'fs';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const map: any = require('map-stream');
import * as vfs from 'vinyl-fs';
import File = require('vinyl');

import {FileOptionsParser} from './../../src/utils/FileOptionsParser';
import {FileOptions, IFileContentOptions} from './../../src/core/SPSaveOptions';

describe('spsave: OptionsParser test', () => {
  it('should return exact FileContentOptions', () => {
    const opts: FileOptions = {
      fileContent: 'spsave',
      folder: 'Assets',
      fileName: 'file.txt'
    };

    const fileOptions: IFileContentOptions[] = FileOptionsParser.parseOptions(opts);

    expect(fileOptions[0]).to.equal(opts);
  });

  it('should return undefined when fileContent not provided', () => {
    const opts: FileOptions = {
      fileContent: null,
      folder: 'Assets',
      fileName: 'file.txt'
    };

    const fileOptions: IFileContentOptions[] = FileOptionsParser.parseOptions(opts);

    expect(fileOptions).to.equal(undefined);
  });

  it('should return valid FileContentOptions with glob param', () => {
    const opts: FileOptions = {
      folder: 'Assets',
      glob: ['test/unit/tests.ts']
    };
    const expectedContent: Buffer = fs.readFileSync('test/unit/tests.ts');
    const fileOptions: IFileContentOptions[] = FileOptionsParser.parseOptions(opts);

    expect(fileOptions[0].fileContent).to.be.instanceOf(Buffer);
    expect(expectedContent.equals(<Buffer>fileOptions[0].fileContent)).is.true;
  });

  it('should return empty options', () => {
    const opts: FileOptions = {
      folder: 'Assets',
      glob: ['test/unit']
    };

    const fileOptions: IFileContentOptions[] = FileOptionsParser.parseOptions(opts);

    expect(fileOptions.length).to.equal(0);
  });

  it('should return valid FileContentOptions from vinyl file', (done) => {
    vfs.src('test/unit/tests.ts')
      .pipe(map((file: File, cb: () => void) => {

        const opts: FileOptions = {
          folder: 'Assets',
          file: file
        };

        const fileOptions: IFileContentOptions[] = FileOptionsParser.parseOptions(opts);
        const expectedContent: Buffer = fs.readFileSync('test/unit/tests.ts');

        expect(fileOptions[0].fileContent).to.be.instanceOf(Buffer);
        expect(expectedContent.equals(<Buffer>fileOptions[0].fileContent)).is.true;
        done();
        cb();
      }));
  });

  it('should throw an error when folder option is empty', () => {
    const opts: FileOptions = {
      folder: '',
      glob: ['test/unit/tests.ts']
    };

    expect(() => {
      FileOptionsParser.parseOptions(opts);
    }).to.throw();
  });

  it('should throw an error when invalid base provided', () => {
    const opts: FileOptions = {
      folder: '',
      glob: ['test/unit/tests.ts'],
      base: 'unknown/test'
    };

    expect(() => {
      FileOptionsParser.parseOptions(opts);
    }).to.throw();
  });
});
