import { Logging, LogLevel } from '../src/index.ts';

function main() {
  Logging.init({
    level: LogLevel.debug,
    loggers: {
      default: LogLevel.trace,
    },
    appenders: [
      {
        name: 'console',
        formatter: {
          name: 'default',
          color: true,
          // json: true,
          // timestampFormat: 'hh:mm:ss.SSS',
          // format: ['{timestamp} [{level}] {message}', '{data}'],
        },
      },
      {
        name: 'file',
        formatter: {
          name: 'default',
          // json: true,
        },
        filename: 'app.log',
        append: false,
      },
    ],
  });
  // Logging.init();

  const log = Logging.getLogger('default');
  const data = {
    user: 'john_doe',
    action: 'login',
    success: true,
    array: [1, 2, 3],
    nested: { key: 'value' },
  };

  log.trace('This is a trace message');
  log.track('This is a tracking message');
  log.debug('This is a debug message', data, { inline: 'data' });
  log.info('This is an info message');
  log.info({ inline: 'data' });
  log.warn('This is a warning message');
  log.error('This is an error message');
  log.fatal('This is a fatal message');
}

main();
