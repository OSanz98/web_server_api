/**
 * Custom class AppError to simplify process of creating errors and handling them.
 * Extends the Error Class
 */
class AppError extends Error {

    constructor(message, statusCode){
        super(message);

        this.statusCode = statusCode;
        // if status code starts with a 4 for a type of 400 status code, then status will be set to failure
        // if status code starts with a 5 for an internal server error, then set status to error.
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        /**
         * Below we tell the error to capture/store the stack trace - however,
         * the second parameters tells node.js that we don't want the stack tract to include
         * the constructor call - as the constructor here will be called on every error creation in this app.
         */
        Error.captureStackTrace(this, this.constructor);
    }
}

export default AppError;