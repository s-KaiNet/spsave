import File = require('vinyl');

import {IEnvironment, IUserCredentials} from 'sp-request';

export enum CheckinType {
  minor = 0,
  major = 1,
  overwrite = 2
}

export interface ICoreOptions {
  siteUrl: string;
  checkin?: boolean;
  checkinType?: CheckinType;
  checkinMessage?: string;
  notification?: boolean;
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

export type CoreOptions = ICoreOptions & IEnvironment & IUserCredentials;
export type GlobOptions = CoreOptions & IGlobOptions;
export type FileContentOptions = CoreOptions & IFileContentOptions;
export type VinylOptions = CoreOptions & IVinylOptions;
export type SPSaveOptions = GlobOptions | FileContentOptions | VinylOptions;

export function isGlobOptions(T: any): T is GlobOptions {
  return !!T.glob;
}

export function isFileContentOptions(T: any): T is FileContentOptions {
  return !!T.fileContent;
}

export function isVinylOptions(T: any): T is VinylOptions {
  return !!T.file;
}
