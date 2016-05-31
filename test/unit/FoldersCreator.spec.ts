import {expect} from 'chai';
import * as sinon from 'sinon';
import * as sprequest from 'sp-request';

import {FoldersCreator} from './../../src/utils/FoldersCreator';
import {defer, IDeferred} from './../../src/utils/Defer';

let spr: sprequest.ISPRequest = sprequest.create({ username: '', password: '' });

describe('spsave: FoldersCreator test', () => {
  it('should create correct folders hierarchy', () => {
    let folder: string = `/assets/app/ng/templates/`;
    let creator: FoldersCreator = new FoldersCreator(spr, folder, 'http://some.sp.url');
    let result: string[] = [];
    creator['createFoldersPathArray'](folder.split('/').filter(path => { return path !== ''; }), result);

    expect(result[0]).to.equal('assets');
    expect(result[1]).to.equal('assets/app');
    expect(result[2]).to.equal('assets/app/ng');
    expect(result[3]).to.equal('assets/app/ng/templates');
  });

  it('should check folders created', (done) => {
    let getDeferred: IDeferred<any> = defer();
    getDeferred.resolve(null);
    let sprGetStub: sinon.SinonStub = sinon.stub(spr, 'get').returns(getDeferred.promise);

    let folder: string = `/assets/app/ng/templates/`;
    let creator: FoldersCreator = new FoldersCreator(spr, folder, 'http://some.sp.url');
    creator.createFoldersHierarchy()
      .then(data => {
        expect(sprGetStub.callCount).to.equal(4);
        done();
      })
      .catch(done)
      .finally(() => {
        sprGetStub.restore();
      });
  });

  it('should create folders hierarchy', (done) => {
    let spy: sinon.SinonStub = sinon.stub(console, 'log');
    let getDeferred: IDeferred<any> = defer();
    let getFileError: Error = new Error();
    (<any>getFileError).statusCode = 404;
    getDeferred.reject(getFileError);

    let digestDeferred: IDeferred<any> = defer();
    digestDeferred.resolve('digest');

    let postDeferred: IDeferred<any> = defer();
    postDeferred.resolve(null);

    let sprGetStub: sinon.SinonStub = sinon.stub(spr, 'get').returns(getDeferred.promise);
    let sprPostStub: sinon.SinonStub = sinon.stub(spr, 'post').returns(postDeferred.promise);
    let sprDigestStub: sinon.SinonStub = sinon.stub(spr, 'requestDigest').returns(digestDeferred.promise);

    let folder: string = `/assets/app/ng/templates/`;
    let creator: FoldersCreator = new FoldersCreator(spr, folder, 'http://some.sp.url');
    creator.createFoldersHierarchy()
      .then(data => {
        expect(sprPostStub.callCount).to.equal(4);
        spy.restore();
        done();
      })
      .catch(err => {
        spy.restore();
        done(err);
      })
      .finally(() => {
        sprGetStub.restore();
        sprPostStub.restore();
        sprDigestStub.restore();
      });
  });

  it('should reject if unable to get folder', (done) => {
    let consoleSpy: sinon.SinonStub = sinon.stub(console, 'log');
    let getDeferred: IDeferred<any> = defer();
    let error: Error = new Error();
    (<any>error).statusCode = 0;
    getDeferred.reject(error);

    let sprGetStub: sinon.SinonStub = sinon.stub(spr, 'get').returns(getDeferred.promise);

    let folder: string = `/assets/app/ng/templates/`;
    let creator: FoldersCreator = new FoldersCreator(spr, folder, 'http://some.sp.url');
    creator.createFoldersHierarchy()
      .then(data => {
        consoleSpy.restore();
        done(new Error('Deferred should be rejected'));
      })
      .catch(err => {
        consoleSpy.restore();
        expect(err).to.equal(error);
        done();
      })
      .finally(() => {
        sprGetStub.restore();
      });
  });

  it('should reject deferred if unable to create folders', (done) => {
    let consoleSpy: sinon.SinonStub = sinon.stub(console, 'log');
    let getDeferred: IDeferred<any> = defer();
    let getFileError: Error = new Error();
    (<any>getFileError).statusCode = 404;
    getDeferred.reject(getFileError);

    let digestDeferred: IDeferred<any> = defer();
    let error: Error = new Error('digest');
    digestDeferred.reject(error);

    let sprGetStub: sinon.SinonStub = sinon.stub(spr, 'get').returns(getDeferred.promise);
    let sprDigestStub: sinon.SinonStub = sinon.stub(spr, 'requestDigest').returns(digestDeferred.promise);

    let folder: string = `/assets/app/ng/templates/`;
    let creator: FoldersCreator = new FoldersCreator(spr, folder, 'http://some.sp.url');
    creator.createFoldersHierarchy()
      .then(data => {
        consoleSpy.restore();
        done(new Error('Deferred should be rejected'));
      })
      .catch(err => {
        consoleSpy.restore();
        expect(err).to.equal(error);
        done();
      })
      .finally(() => {
        sprGetStub.restore();
        sprDigestStub.restore();
      });
  });
});
