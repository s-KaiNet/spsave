import {IUserCredentials} from 'sp-request';

export var onprem: IUserCredentials = {
  username: '[user]',
  password: '[pass]'
};

export var online: IUserCredentials = {
  username: '[user]',
  password: '[pass]'
};

export var url: any = {
  online: 'https://[domain].sharepoint.com',
  onprem: 'http://onprem/sharepoint/url'
};
