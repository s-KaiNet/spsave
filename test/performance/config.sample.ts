import { IAuthOptions } from 'sp-request';

export var onlineUrl: string = '[sharepoint online url]';
export var onpremAdfsEnabledUrl: string = '[sharepint on premise url with adfs configured]';
export var onpremNtlmEnabledUrl: string = '[sharepint on premise url with ntlm]]';

export var onlineCreds: IAuthOptions = {
  username: '[username]',
  password: '[password]'
};

export var onpremCreds: IAuthOptions = {
  username: '[username]',
  domain: '[domain]',
  password: '[password]'
};

export var onpremAddinOnly: IAuthOptions = {
  clientId: '[clientId]',
  issuerId: '[issuerId]',
  realm: '[realm]',
  rsaPrivateKeyPath: '[rsaPrivateKeyPath]',
  shaThumbprint: '[shaThumbprint]'
};

export var onlineAddinOnly: IAuthOptions = {
  clientId: '[clientId]',
  clientSecret: '[clientSecret]',
  realm: '[realm]'
};

export var adfsCredentials: IAuthOptions = {
  username: '[username]',
  password: '[password]',
  relyingParty: '[relying party]',
  adfsUrl: '[adfs url]'
};
