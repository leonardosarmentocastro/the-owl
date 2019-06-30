const chalk = require('chalk');

exports.getErrorMessageForServerStartup = (err, options) => {
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
    `\r\n${chalk.white.bgHex('#512da8')('  CLOSED  ')}`,
    `${chalk.gray('Server closed successfully!')}`,
  ].join(' ');

  return message;
}

exports.getSuccessMessageForServerStartup = (options) => {
  const { port, environment } = options;
  const message = [
    [ // line 1
      `\r\n${chalk.white.bgHex('#046824')('  STARTED  ')}`,
      `${chalk.gray('Server listening on port')} ${chalk.white(port)}`,
      `${chalk.gray('in')} ${chalk.white(environment)} ${chalk.gray('mode.')}`
    ].join(' '),
    [ // line 2
      `${chalk.black.bgWhite('  NOTE  ')}`,
      `${chalk.white('If working locally:')}`,
      `${chalk.gray('You need to restart the server manually to apply the changes made on "the-owl" package.')}`
    ].join(' '),
  ].join('\r\n');

  return message;
}

