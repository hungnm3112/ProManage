const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, message) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}\n`;
  }

  writeLog(filename, message) {
    const logPath = path.join(this.logDir, filename);
    fs.appendFileSync(logPath, message);
  }

  info(message) {
    const formattedMessage = this.formatMessage('INFO', message);
    console.log(formattedMessage);
    this.writeLog('combined.log', formattedMessage);
  }

  error(message) {
    const formattedMessage = this.formatMessage('ERROR', message);
    console.error(formattedMessage);
    this.writeLog('error.log', formattedMessage);
    this.writeLog('combined.log', formattedMessage);
  }

  warn(message) {
    const formattedMessage = this.formatMessage('WARN', message);
    console.warn(formattedMessage);
    this.writeLog('combined.log', formattedMessage);
  }

  debug(message) {
    if (process.env.NODE_ENV === 'development') {
      const formattedMessage = this.formatMessage('DEBUG', message);
      console.log(formattedMessage);
      this.writeLog('combined.log', formattedMessage);
    }
  }

  // Stream for morgan
  get stream() {
    return {
      write: (message) => {
        this.info(message.trim());
      }
    };
  }
}

module.exports = new Logger();
