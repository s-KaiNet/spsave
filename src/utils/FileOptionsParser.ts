import File = require('vinyl');
import * as _ from 'lodash';
import * as path from 'path';
import * as globby from 'globby';
import * as fs from 'fs';

import * as opts from './../core/SPSaveOptions';
import {UrlHelper} from './UrlHelper';

export class FileOptionsParser {
  public static parseOptions(options: opts.FileOptions): opts.IFileContentOptions[] {
    if (opts.isFileContentOptions(options)) {
      return [options];
    }

    if (opts.isGlobOptions(options)) {
      let fileContentOptions: opts.IFileContentOptions[] = [];

      _.defaults(options, {
        folder: ''
      });

      FileOptionsParser.createVinylFromGlob(options)
        .forEach(file => {
          fileContentOptions.push(FileOptionsParser.createFileOptionsFromVinyl(file, options));
        });

      return fileContentOptions;
    }

    if (opts.isVinylOptions(options)) {
      _.defaults(options, {
        folder: ''
      });

      return [FileOptionsParser.createFileOptionsFromVinyl(options.file, options)];
    }

    return undefined;
  }

  private static createFileOptionsFromVinyl(file: File, options: opts.IGlobOptions | opts.IVinylOptions): opts.IFileContentOptions {
    let newOptions: opts.IFileContentOptions = _.assign<{}, any>({}, options);
    newOptions.fileName = path.basename(file.path);
    newOptions.fileContent = <Buffer>file.contents;
    newOptions.folder = FileOptionsParser.getFolderToUpload(file, options.folder);

    if (!newOptions.folder || newOptions.folder === '.') {
      throw new Error('Folder option is empty. Either provide folder explicitly, or specify "base" option');
    }

    return newOptions;
  }

  private static createVinylFromGlob(options: opts.IGlobOptions): File[] {
    let cwd: string = process.cwd();

    return globby.sync(options.glob, { cwd: cwd }).map(filePath => {
      let stat: fs.Stats = fs.statSync(filePath);

      if (stat.isDirectory()) {
        return undefined;
      }

      return new File({
        cwd: cwd,
        base: options.base || path.dirname(path.resolve(filePath)),
        path: path.resolve(filePath),
        stat: stat,
        contents: fs.readFileSync(filePath)
      });
    })
      .filter(x => {
        return x !== undefined;
      });
  }

  private static getFolderToUpload(file: File, folder: string): string {
    let parsedBase: string = file.base || path.dirname(path.resolve(file.path));
    let base: string = parsedBase.replace(/\\/g, '/');
    let filePath: string = file.path.replace(/\\/g, '/');
    let fileName: string = path.basename(file.path);
    let indx: number = filePath.indexOf(base);

    if (indx === -1) {
      throw new Error(`'base' option has invalid value. 'base' should be a substring of the file path. 'base': ${file.base}` +
        ` file path: ${file.path}`);
    }

    let startIndex: number = indx + base.length;
    let folderPart: string = filePath.substring(startIndex, filePath.length).replace(fileName, '').replace(/\/\//g, '/');

    return UrlHelper.trimSlashes(path.join(folder, folderPart).replace(/\\/g, '/'));
  }
}
