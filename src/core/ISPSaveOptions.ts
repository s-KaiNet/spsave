import File = require('vinyl');

import {IEnvironment, IUserCredentials} from 'sp-request';

export interface ICoreOptions {
  siteUrl: string;
  checkin?: boolean;
  checkinType?: number | string;
}

export interface IPathOptions {
  path: string | string[];
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
}

export type CoreOptions = ICoreOptions & IEnvironment & IUserCredentials;
export type PathOptions = CoreOptions & IPathOptions;
export type FileContentOptions = CoreOptions & IFileContentOptions;
export type VinylOptions = CoreOptions & IVinylOptions;
export type SPSaveOptions = PathOptions | FileContentOptions | VinylOptions;

export function isPathOptions(T: any): T is PathOptions {
  return !!T.path;
}

export function isFileContentOptions(T: any): T is FileContentOptions {
  return !!T.fileContent;
}

export function isVinylOptions(T: any): T is VinylOptions {
  return !!T.file;
}
