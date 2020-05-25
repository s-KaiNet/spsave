import { IAuthOptions } from 'sp-request';

export const onlineUrl = '[sharepoint online url]';
export const onpremAdfsEnabledUrl = '[sharepint on premise url with adfs configured]';
export const onpremNtlmEnabledUrl = '[sharepint on premise url with ntlm]]';

export const onlineCreds: IAuthOptions = {
  username: '[username]',
  password: '[password]'
};

export const onlineWithAdfsCreds: IAuthOptions = {
  username: '[username]',
  password: '[password]'
};

export const onpremCreds: IAuthOptions = {
  username: '[username]',
  domain: '[domain]',
  password: '[password]'
};

export const onpremAddinOnly: IAuthOptions = {
  clientId: '[clientId]',
  issuerId: '[issuerId]',
  realm: '[realm]',
  rsaPrivateKeyPath: '[rsaPrivateKeyPath]',
  shaThumbprint: '[shaThumbprint]'
};

export const onlineAddinOnly: IAuthOptions = {
  clientId: '[clientId]',
  clientSecret: '[clientSecret]',
  realm: '[realm]'
};

export const adfsCredentials: IAuthOptions = {
  username: '[username]',
  password: '[password]',
  relyingParty: '[relying party]',
  adfsUrl: '[adfs url]'
};
