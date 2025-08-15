import { LogM8 } from '../src/LogM8.ts';

// Test that the MatchFilter is properly registered and working
const logM8 = new LogM8();

logM8.init({
  level: 'info',
  filters: [{ name: 'match-filter', deny: { 'context.userId': 'blocked' } }],
  appenders: [{ name: 'console', formatter: 'default' }],
});

const logger = logM8.getLogger('test');

// This should be logged
logger.info('This message should appear');

// This should be blocked by the filter
logger.setContext({ userId: 'blocked' });
logger.info('This message should be blocked');

// This should be logged again
const logger2 = logM8.getLogger('test2');
logger2.info('This message should also appear');

console.log('MatchFilter integration test completed successfully!');
