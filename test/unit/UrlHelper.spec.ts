import {expect} from 'chai';

import {UrlHelper} from './../../src/utils/UrlHelper';

describe('spsave: UrlHelper test', () => {

  it('should remove trailing slash', () => {
    const startUrl = 'some/url/';
    const expectUrl = 'some/url';

    const actualUrl: string = UrlHelper.removeTrailingSlash(startUrl);

    expect(actualUrl).to.equal(expectUrl);
  });

  it('should remove trailing back slash', () => {
    const startUrl = 'some/url\\';
    const expectUrl = 'some/url';

    const actualUrl: string = UrlHelper.removeTrailingSlash(startUrl);

    expect(actualUrl).to.equal(expectUrl);
  });

  it('should remove leading slash', () => {
    const startUrl = '/some/url';
    const expectUrl = 'some/url';

    const actualUrl: string = UrlHelper.removeLeadingSlash(startUrl);

    expect(actualUrl).to.equal(expectUrl);
  });

  it('should remove leading back slash', () => {
    const startUrl = '\\some/url';
    const expectUrl = 'some/url';

    const actualUrl: string = UrlHelper.removeLeadingSlash(startUrl);

    expect(actualUrl).to.equal(expectUrl);
  });

  it('should remove both slashes', () => {
    const startUrl = '/some/url/';
    const expectUrl = 'some/url';

    const actualUrl: string = UrlHelper.trimSlashes(startUrl);

    expect(actualUrl).to.equal(expectUrl);
  });

  it('should remove both back slashes', () => {
    const startUrl = '\\some/url\\';
    const expectUrl = 'some/url';

    const actualUrl: string = UrlHelper.trimSlashes(startUrl);

    expect(actualUrl).to.equal(expectUrl);
  });
});
