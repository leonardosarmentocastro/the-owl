const chalk = require('chalk');

exports.getErrorMessageForServerStatup = (err, options) => {
  const { port, environment } = options;
  const message = [
    [ // line 1
      `${chalk.white.bgHex('#ba1912')('  ERROR  ')}`,
      `${chalk.gray('Failed to start server')} ${chalk.white(port)}`,
      `${chalk.gray('in')} ${chalk.white(environment)} ${chalk.gray('mode.')}`,
    ].join(' '),
    [ // line 2
      `${chalk.black.bgWhite('  STACKTRACE  ')}`,
      `${chalk.gray(err)}`,
    ].join(' '),
  ].join('\r\n');

  return message;
}

exports.getSuccessMessageForServerClose = () => {
  const message = [
    `${chalk.white.bgHex('#512da8')('  CLOSED  ')}`,
    `${chalk.gray('Server closed successfully!')}`,
  ].join(' ');

  return message;
}

exports.getSuccessMessageForServerStatup = (options) => {
  const { port, environment } = options;
  const message = [
    `${chalk.white.bgHex('#046824')('  STARTED  ')}`,
    `${chalk.gray('Server listening on port')} ${chalk.white(port)}`,
    `${chalk.gray('in')} ${chalk.white(environment)} ${chalk.gray('mode.')}`
  ].join(' ');

  return message;
}

