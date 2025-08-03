import { Logging, LogLevel } from '../src/index.ts';

function main() {
  Logging.init({
    level: LogLevel.debug,
    loggers: {
      default: LogLevel.info,
    },
    appenders: [
      {
        name: 'console',
        formatter: 'default',
      },
    ],
    filters: [],
    formatters: [
      {
        name: 'default',
        timestampFormat: 'hh:mm:ss.SSS',
        // format: ['{timestamp} [{level}] {message}', '{logger}'],
      },
    ],
  });
  // Logging.init();

  const log = Logging.getLogger('default');

  log.trace('This is a trace message');
  log.track('This is a tracking message');
  log.debug('This is a debug message');
  log.info('This is an info message');
  log.warn('This is a warning message');
  log.error('This is an error message');
  log.fatal('This is a fatal message');
}

main();
