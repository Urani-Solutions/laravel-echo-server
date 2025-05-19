const colors = require('colors');

function getTimestamp(): string {
    // This will use the local time of the server
    return new Date().toISOString();
}

export class Log {
    /**
     * Console log heading 1.
     *
     * @param  {string|object} message
     * @return {void}
     */
    static title(message: any): void {
        console.log(`[${getTimestamp()}]`, colors.bold(message));
    }

    /**
     * Console log heaing 2.
     *
     * @param  {string|object} message
     * @return {void}
     */
    static subtitle(message: any): void {
        console.log(`[${getTimestamp()}]`, colors.yellow.bold(message));
    }

    /**
     * Console log info.
     *
     * @param  {string|object} message
     * @return {void}
     */
    static info(message: any): void {
        console.log(`[${getTimestamp()}]`, colors.cyan(message));
    }

    /**
     * Console log success.
     *
     * @param  {string|object} message
     * @return {void}
     */
    static success(message: any): void {
        console.log(`[${getTimestamp()}]`, colors.green('\u2714 '), message);
    }

    /**
     *
     *
     * Console log info.
     *
     * @param  {string|object} message
     * @return {void}
     */
    static error(message: any): void {
        console.log(`[${getTimestamp()}]`, colors.red(message));
    }

    /**
     * Console log warning.
     *
     * @param  {string|object} message
     * @return {void}
     */
    static warning(message: any): void {
        console.log(`[${getTimestamp()}]`, colors.yellow('\u26A0 ' + message));
    }
}
