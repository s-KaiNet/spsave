import {expect} from 'chai';
import * as sinon from 'sinon';
import * as notifier from 'node-notifier';

import {spsave} from './../../src/core/SPSave';
import {FileSaver} from './../../src/core/FileSaver';
import {FileContentOptions, GlobOptions} from './../../src/core/SPSaveOptions';
import {defer, IDeferred} from './../../src/utils/Defer';

describe('spsave: SPSave test', () => {
  it('should save multiple files', done => {
    let saveDeferred: IDeferred<any> = defer();
    saveDeferred.resolve(null);

    let saveStub: sinon.SinonStub = sinon.stub(FileSaver.prototype, 'save').returns(saveDeferred.promise);

    let opts: GlobOptions = {
      username: '',
      password: '',
      folder: 'Assets',
      siteUrl: 'http://sp.url',
      glob: ['test/unit/*.*']
    };

    spsave(opts)
      .then(data => {
        done();
      })
      .catch(done)
      .finally(() => {
        saveStub.restore();
      });
  });

  it('should save single file', done => {
    let saveDeferred: IDeferred<any> = defer();
    saveDeferred.resolve(null);

    let saveStub: sinon.SinonStub = sinon.stub(FileSaver.prototype, 'save').returns(saveDeferred.promise);

    let opts: FileContentOptions = {
      username: '',
      password: '',
      fileContent: 'spsave',
      folder: 'Assets',
      fileName: 'file.txt',
      siteUrl: 'http://sp.url'
    };

    spsave(opts)
      .then(data => {
        done();
      })
      .catch(done)
      .finally(() => {
        saveStub.restore();
      });
  });

  it('should show notification', done => {
    let saveDeferred: IDeferred<any> = defer();
    saveDeferred.resolve(null);

    let saveStub: sinon.SinonStub = sinon.stub(FileSaver.prototype, 'save').returns(saveDeferred.promise);
    let notifyStub: sinon.SinonStub = sinon.stub(notifier, 'notify');

    let opts: FileContentOptions = {
      username: '',
      password: '',
      fileContent: 'spsave',
      folder: 'Assets',
      fileName: 'file.txt',
      siteUrl: 'http://sp.url',
      notification: true
    };

    spsave(opts)
      .then(data => {
        expect(notifyStub.calledOnce).is.true;
        done();
      })
      .catch(done)
      .finally(() => {
        saveStub.restore();
        notifyStub.restore();
      });
  });

  it('should reject deferred', done => {
    let consoleSpy: sinon.SinonStub = sinon.stub(console, 'log');
    let saveDeferred: IDeferred<any> = defer();
    let error: Error = new Error('failed');
    saveDeferred.reject(error);

    let saveStub: sinon.SinonStub = sinon.stub(FileSaver.prototype, 'save').returns(saveDeferred.promise);
    let notifyStub: sinon.SinonStub = sinon.stub(notifier, 'notify');

    let opts: FileContentOptions = {
      username: '',
      password: '',
      fileContent: 'spsave',
      folder: 'Assets',
      fileName: 'file.txt',
      siteUrl: 'http://sp.url',
      notification: true
    };

    spsave(opts)
      .then(data => {
        done(new Error('Deferred should be rejected'));
        consoleSpy.restore();
      })
      .catch(err => {
        consoleSpy.restore();
        expect(error).to.equal(err);
        done();
      })
      .finally(() => {
        saveStub.restore();
        notifyStub.restore();
      });
  });

  it('should reject deferred with precise error', done => {
    let consoleSpy: sinon.SinonStub = sinon.stub(console, 'log');
    let saveDeferred: IDeferred<any> = defer();
    let error: Error = new Error();
    saveDeferred.reject(error);

    let saveStub: sinon.SinonStub = sinon.stub(FileSaver.prototype, 'save').returns(saveDeferred.promise);

    let opts: GlobOptions = {
      username: '',
      password: '',
      folder: 'Assets',
      siteUrl: 'http://sp.url',
      glob: ['test/unit/*.*']
    };

    spsave(opts)
      .then(data => {
        done(new Error('Deferred should be rejected'));
        consoleSpy.restore();
      })
      .catch(err => {
        consoleSpy.restore();
        expect(err).to.equal(error);
        done();
      })
      .finally(() => {
        saveStub.restore();
      });
  });
});
