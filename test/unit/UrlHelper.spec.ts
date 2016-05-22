import {expect} from 'chai';

import {UrlHelper} from './../../src/utils/UrlHelper';

describe('spsave: UrlHelper test', () => {

  it('should remove trailing slash', () => {
    let startUrl: string = 'some/url/';
    let expectUrl: string = 'some/url';

    let actualUrl: string = UrlHelper.removeTrailingSlash(startUrl);

    expect(actualUrl).to.equal(expectUrl);
  });

  it('should remove trailing back slash', () => {
    let startUrl: string = 'some/url\\';
    let expectUrl: string = 'some/url';

    let actualUrl: string = UrlHelper.removeTrailingSlash(startUrl);

    expect(actualUrl).to.equal(expectUrl);
  });

  it('should remove leading slash', () => {
    let startUrl: string = '/some/url';
    let expectUrl: string = 'some/url';

    let actualUrl: string = UrlHelper.removeLeadingSlash(startUrl);

    expect(actualUrl).to.equal(expectUrl);
  });

  it('should remove leading back slash', () => {
    let startUrl: string = '\\some/url';
    let expectUrl: string = 'some/url';

    let actualUrl: string = UrlHelper.removeLeadingSlash(startUrl);

    expect(actualUrl).to.equal(expectUrl);
  });

  it('should remove both slashes', () => {
    let startUrl: string = '/some/url/';
    let expectUrl: string = 'some/url';

    let actualUrl: string = UrlHelper.trimSlashes(startUrl);

    expect(actualUrl).to.equal(expectUrl);
  });

  it('should remove both back slashes', () => {
    let startUrl: string = '\\some/url\\';
    let expectUrl: string = 'some/url';

    let actualUrl: string = UrlHelper.trimSlashes(startUrl);

    expect(actualUrl).to.equal(expectUrl);
  });
});
