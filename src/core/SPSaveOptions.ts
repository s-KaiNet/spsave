import File = require('vinyl');
import {IAuthOptions} from 'sp-request';

export enum CheckinType {
  minor = 0,
  major = 1,
  overwrite = 2,
  nocheckin = 3
}

export interface ICoreOptions {
  siteUrl: string;
  checkin?: boolean;
  checkinType?: CheckinType;
  checkinMessage?: string;
  notification?: boolean;
  filesMetaData?: IFileMetaData[];
}

export interface IFileMetaData {
  fileName: string;
  updated?: boolean;
  metadata: any;
}

export interface IGlobOptions {
  glob: string | string[];
  folder?: string;
  base?: string;
}

export interface IFileContentOptions {
  fileName: string;
  fileContent: string | Buffer;
  folder: string;
}

export interface IVinylOptions {
  file: File;
  folder?: string;
}

export type FileOptions = IGlobOptions | IFileContentOptions | IVinylOptions;

export interface ISPSaveOptions {
  creds: IAuthOptions;
  files: IFileContentOptions[];
  core: ICoreOptions;
}

export function isGlobOptions(T: FileOptions): T is IGlobOptions {
  return !!(T as IGlobOptions).glob;
}

export function isFileContentOptions(T: FileOptions): T is IFileContentOptions {
  return !!(T as IFileContentOptions).fileContent || (T as IFileContentOptions).fileContent === '';
}

export function isVinylOptions(T: FileOptions): T is IVinylOptions {
  return !!(T as IVinylOptions).file;
}
