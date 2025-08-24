import { logger } from '../logger';

describe('logger', () => {
  it('powinien logować info bez błędu', () => {
    expect(() => logger.info('test message')).not.toThrow();
  });
});
