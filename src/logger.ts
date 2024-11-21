import winston from 'winston';

interface ExtendedLogger extends winston.Logger {
    success: (message: string) => void;
    content: (message: string) => void;
}

export let logger: ExtendedLogger;

interface InitLogger {
    debugLevel: 'debug' | 'info';
}

const customLevels = {
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        success: 2,
        content: 2,
        http: 3,
        verbose: 4,
        debug: 5,
        silly: 6,
    },
};

export const initLogger = (params: InitLogger) => {
    const customFormat = winston.format.printf(({ level, message, stack }) => {
        let prefix;
        let coloredMessage = message as string;

        switch (level) {
            case 'error':
                prefix = stack ? '' : errorColor('error: ');
                coloredMessage = `${JSON.stringify(stack) ?? coloredMessage}`;
                break;
            case 'warn':
                prefix = warnColor('warn: ');
                break;
            case 'debug':
                prefix = debugColor('debug: ');
                break;
            case 'success':
                prefix = successColor('✔ ');
                break;
            case 'content':
                prefix = '';
                break;
            default:
                prefix = `${level}: `;
        }

        return `${prefix}${coloredMessage}`;
    });

    logger = winston.createLogger({
        level: params.debugLevel,
        levels: customLevels.levels,
        format: winston.format.combine(winston.format.errors({ stack: true }), customFormat),
        transports: [new winston.transports.Console()],
    }) as ExtendedLogger;

    logger.success = function (message) {
        this.log('success', message);
    };

    logger.content = function (message) {
        this.log('content', message);
    };
};

export const errorColor = (str: string) => {
    // Add ANSI escape codes to display text in red.
    return `\x1b[31m${str}\x1b[0m`;
};

export const successColor = (str: string) => {
    // Add ANSI escape codes to display text in green.
    return `\x1b[32m${str}\x1b[0m`;
};

export const warnColor = (str: string) => {
    // Add ANSI escape codes to display text in yellow.
    return `\x1b[33m${str}\x1b[0m`;
};

export const debugColor = (str: string) => {
    // Add ANSI escape codes to display text in gray.
    return `\x1b[90m${str}\x1b[0m`;
};
