import { LogLevel, LogM8 } from '../src/index.ts';

function main() {
  const logEarly = LogM8.getLogger('before').getLogger('main').getLogger('init');

  logEarly.info('Initializing logging system...');

  LogM8.init({
    level: LogLevel.debug,
    loggers: {
      default: LogLevel.trace,
    },
    appenders: [
      {
        name: 'console',
        formatter: {
          name: 'default-formatter',
          color: true,
          // timestampFormat: 'hh:mm:ss.SSS',
          // format: ['{timestamp} [{level}] {message}', '{data}'],
        },
      },
      {
        name: 'file',
        formatter: {
          name: 'json-formatter',
          timestampFormat: 'hh:mm:ss.SSS',
          pretty: true,
        },
        filename: 'app.log',
        append: false,
      },
    ],
  });
  // Logging.init();

  const log = LogM8.getLogger('default');
  const data = {
    user: 'john_doe',
    action: 'login',
    success: true,
    array: [1, 2, 3],
    nested: { key: 'value' },
  };

  const err = new Error('Something went wrong');
  const cause = new Error('Root cause error');
  err.cause = cause;

  log.trace('This is a trace message');
  log.track('This is a tracking message');
  log.debug('This is a debug message', data, { inline: 'data' });
  log.info('This is an info message');
  log.info({ inline: 'data' });
  log.warn('This is a warning message');
  log.error('This is an error message', err);
  log.fatal('This is a fatal message');
}

main();
