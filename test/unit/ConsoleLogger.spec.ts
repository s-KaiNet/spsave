import {expect} from 'chai';
import * as sinon from 'sinon';

import {ConsoleLogger} from './../../src/utils/ConsoleLogger';

let logger: ConsoleLogger = new ConsoleLogger();

describe('spsave: ConsoleLogger test', () => {
  it('should write to console', () => {
    let spy: sinon.SinonStub = sinon.stub(console, 'log');
    let message: string = 'message';

    logger.info(message);
    logger.error(message);
    logger.success(message);
    logger.warning(message);
    logger.info('');

    spy.restore();

    expect(spy.callCount).to.equal(5);
  });
});
