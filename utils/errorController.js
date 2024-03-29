import AppError from "./appError.js";

/**
 * This function is used to convert an error send from MongoDB to a format that we can digest/send
 * to clients.
 * @param {Error} err 
 * @returns AppError instance with custom message and statusCode
 */
const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}.`
    return new AppError(message, 400);
};


/**
 * This function is used to convert an error send from MongoDB to a format that we can digest/send
 * to clients.
 * @param {Error} err 
 * @returns AppError instance with custom message and statusCode
 */
const handleDuplicateFieldsDB = err => {
    // extract duplicate field value from response sent by MongoDB
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value ${value}. Please use another value.`
    return new AppError(message, 400);
};


/**
 * This is a custom function for handling the errors being sent in the response in development
 * environment - add more information such as error stack trace and error itself.
 * @param {Error} err 
 * @param {Response} res 
 */
const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
};

/**
 * This is a custom function to handle the response set back to a client when an error has
 * occured. Here we send back a generic message to the user, and hide information like
 * error stack trace.
 * @param {Error} err 
 * @param {Response} res 
 */
const sendErrorProd = (err, res) => {
    // Operational, trusted error: send message to the client.
    if(err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });

    // Programming or other unknown error: don't leak error details
    } else {
        // 1) log error - here you could send a log to analytics library for example.
        console.error('ERROR', err);
        // 2) send generic message
        res.status(500).json({
            status: 'error',
            message: 'Something went very wrong!'
        })
    }
};

/**
 * This function is used to handle errors where the user input for a patch/put or post request is invalid
 * Extracts all possible errors with the user input and displays it in a suitable format to the user. 
 * @param {Error} err
 * @returns new AppError instantiation
 */
const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
}


// global error middleware function - executed whenever we call next(err) in our application - passing error to this middleware func.
export default (err, req, res, next) => {
    err.statusCode = err.statusCode || 500; //default value set to 500 for internal server error
    err.status = err.status || 'error'; //default set to 'error'
    // display more error information to a developer if in dev environment
    // if in prod environment then just send a nice response to client.
    if(process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else if(process.env.NODE_ENV === 'production') {
        let error = { ...err }; //destructure error and copy it over to new variable
        if(error.name === 'CastError') error = handleCastErrorDB(error);
        if(error.code === 11000) error = handleDuplicateFieldsDB(error);
        if(error.name === 'ValidationError') error = handleValidationErrorDB(error);
        sendErrorProd(error, res);
    }
};