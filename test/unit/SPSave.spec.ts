import {expect} from 'chai';
import * as sinon from 'sinon';
import * as notifier from 'node-notifier';
import {IAuthOptions} from 'sp-request';

import {spsave} from './../../src/core/SPSave';
import {FileSaver} from './../../src/core/FileSaver';
import {ICoreOptions, FileOptions} from './../../src/core/SPSaveOptions';
import {defer, IDeferred} from './../../src/utils/Defer';

describe('spsave: SPSave test', () => {
  it('should save multiple files', done => {
    let saveDeferred: IDeferred<any> = defer();
    saveDeferred.resolve(null);

    let saveStub: sinon.SinonStub = sinon.stub(FileSaver.prototype, 'save').returns(saveDeferred.promise);

    let creds: IAuthOptions = {
      username: '',
      password: ''
    };

    let file: FileOptions = {
      glob: ['test/unit/*.*'],
      folder: 'Assets'
    };

    let core: ICoreOptions = {
      siteUrl: 'http://sp.url'
    };

    spsave(core, creds, file)
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

    let creds: IAuthOptions = {
      username: '',
      password: ''
    };

    let file: FileOptions = {
      fileContent: 'spsave',
      folder: 'Assets',
      fileName: 'file.txt'
    };

    let core: ICoreOptions = {
      siteUrl: 'http://sp.url'
    };

    spsave(core, creds, file)
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

    let creds: IAuthOptions = {
      username: '',
      password: ''
    };

    let file: FileOptions = {
      fileContent: 'spsave',
      folder: 'Assets',
      fileName: 'file.txt'
    };

    let core: ICoreOptions = {
      siteUrl: 'http://sp.url',
      notification: true
    };

    spsave(core, creds, file)
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

    let creds: IAuthOptions = {
      username: '',
      password: ''
    };

    let file: FileOptions = {
      fileContent: 'spsave',
      folder: 'Assets',
      fileName: 'file.txt'
    };

    let core: ICoreOptions = {
      siteUrl: 'http://sp.url',
      notification: true
    };

    spsave(core, creds, file)
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

    let creds: IAuthOptions = {
      username: '',
      password: ''
    };

    let file: FileOptions = {
      folder: 'Assets',
      glob: ['test/unit/*.*']
    };

    let core: ICoreOptions = {
      siteUrl: 'http://sp.url'
    };

    spsave(core, creds, file)
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
