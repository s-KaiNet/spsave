import File = require('vinyl');
import * as path from 'path';
import * as globby from 'globby';
import * as fs from 'fs';

import * as opts from './../core/SPSaveOptions';
import { UrlHelper } from './UrlHelper';

export class FileOptionsParser {
  public static parseOptions(options: opts.FileOptions): opts.IFileContentOptions[] {
    if (opts.isFileContentOptions(options)) {
      return [options];
    }

    if (opts.isGlobOptions(options)) {
      const fileContentOptions: opts.IFileContentOptions[] = [];

      options = Object.assign({
        folder: ''
      }, options);

      FileOptionsParser.createVinylFromGlob(options)
        .forEach(file => {
          fileContentOptions.push(FileOptionsParser.createFileOptionsFromVinyl(file, options as any));
        });

      return fileContentOptions;
    }

    if (opts.isVinylOptions(options)) {
      options = Object.assign({
        folder: ''
      }, options);

      return [FileOptionsParser.createFileOptionsFromVinyl(options.file, options)];
    }

    return undefined;
  }

  private static createFileOptionsFromVinyl(file: File, options: opts.IGlobOptions | opts.IVinylOptions): opts.IFileContentOptions {
    const newOptions: opts.IFileContentOptions = Object.assign<any, opts.IGlobOptions | opts.IVinylOptions>({}, options);
    newOptions.fileName = path.basename(file.path);
    newOptions.fileContent = <Buffer>file.contents;
    newOptions.folder = FileOptionsParser.getFolderToUpload(file, options.folder);

    if (!newOptions.folder || newOptions.folder === '.') {
      throw new Error('Folder option is empty. Either provide folder explicitly, or specify "base" option');
    }

    return newOptions;
  }

  private static createVinylFromGlob(options: opts.IGlobOptions): File[] {
    const cwd: string = process.cwd();

    return globby.sync(options.glob, { cwd: cwd }).map(filePath => {
      const stat: fs.Stats = fs.statSync(filePath);

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
    const parsedBase: string = file.base || path.dirname(path.resolve(file.path));
    const base: string = parsedBase.replace(/\\/g, '/');
    const filePath: string = file.path.replace(/\\/g, '/');
    const fileName: string = path.basename(file.path);
    const indx: number = filePath.indexOf(base);

    if (indx === -1) {
      throw new Error(`'base' option has invalid value. 'base' should be a substring of the file path. 'base': ${file.base}` +
        ` file path: ${file.path}`);
    }

    const startIndex: number = indx + base.length;
    const folderPart: string = filePath.substring(startIndex, filePath.length).replace(fileName, '').replace(/\/\//g, '/');

    return UrlHelper.trimSlashes(path.join(folder, folderPart).replace(/\\/g, '/'));
  }
}
