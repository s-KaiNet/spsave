import { expect } from 'chai';
import * as sinon from 'sinon';
import * as notifier from 'node-notifier';
import { IAuthOptions } from 'sp-request';

import { spsave } from './../../src/core/SPSave';
import { FileSaver } from './../../src/core/FileSaver';
import { ICoreOptions, FileOptions } from './../../src/core/SPSaveOptions';
import { defer, IDeferred } from './../../src/utils/Defer';

describe('spsave: SPSave test', () => {
  it('should save multiple files', done => {
    const saveDeferred: IDeferred<any> = defer();
    saveDeferred.resolve(null);

    const saveStub: sinon.SinonStub = sinon.stub(FileSaver.prototype, 'save').returns(saveDeferred.promise);

    const creds: IAuthOptions = {
      username: '',
      password: ''
    };

    const file: FileOptions = {
      glob: ['test/unit/*.*'],
      folder: 'Assets'
    };

    const core: ICoreOptions = {
      siteUrl: 'http://sp.url'
    };

    spsave(core, creds, file)
      .then(() => {
        done();
      })
      .catch(done)
      .finally(() => {
        saveStub.restore();
      });
  });

  it('should save single file', done => {
    const saveDeferred: IDeferred<any> = defer();
    saveDeferred.resolve(null);

    const saveStub: sinon.SinonStub = sinon.stub(FileSaver.prototype, 'save').returns(saveDeferred.promise);

    const creds: IAuthOptions = {
      username: '',
      password: ''
    };

    const file: FileOptions = {
      fileContent: 'spsave',
      folder: 'Assets',
      fileName: 'file.txt'
    };

    const core: ICoreOptions = {
      siteUrl: 'http://sp.url'
    };

    spsave(core, creds, file)
      .then(() => {
        done();
      })
      .catch(done)
      .finally(() => {
        saveStub.restore();
      });
  });

  it('should reject deferred', done => {
    const consoleSpy: sinon.SinonStub = sinon.stub(console, 'log');
    const saveDeferred: IDeferred<any> = defer();
    const error: Error = new Error('failed');
    saveDeferred.reject(error);

    const saveStub: sinon.SinonStub = sinon.stub(FileSaver.prototype, 'save').returns(saveDeferred.promise);
    const notifyStub: sinon.SinonStub = sinon.stub(notifier, 'notify');

    const creds: IAuthOptions = {
      username: '',
      password: ''
    };

    const file: FileOptions = {
      fileContent: 'spsave',
      folder: 'Assets',
      fileName: 'file.txt'
    };

    const core: ICoreOptions = {
      siteUrl: 'http://sp.url',
      notification: true
    };

    spsave(core, creds, file)
      .then(() => {
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
    const consoleSpy: sinon.SinonStub = sinon.stub(console, 'log');
    const saveDeferred: IDeferred<any> = defer();
    const error: Error = new Error();
    saveDeferred.reject(error);

    const saveStub: sinon.SinonStub = sinon.stub(FileSaver.prototype, 'save').returns(saveDeferred.promise);

    const creds: IAuthOptions = {
      username: '',
      password: ''
    };

    const file: FileOptions = {
      folder: 'Assets',
      glob: ['test/unit/*.*']
    };

    const core: ICoreOptions = {
      siteUrl: 'http://sp.url'
    };

    spsave(core, creds, file)
      .then(() => {
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
