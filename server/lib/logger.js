const log4js = require('log4js')

log4js.configure({
  appenders: {
    console: {
      type: 'console'
    },
    error: {
      type: 'file',
      filename: 'logs/eleme.log',
      maxLogSize: 1024000,
      backups: 10
    }
  },
  categories: {
    default: {
      appenders: ['console', 'error'],
      level: 'trace'
    }
  },
  pm2: true,
  replaceConsole: true
})

module.exports = log4js.getLogger('elemeCookie')