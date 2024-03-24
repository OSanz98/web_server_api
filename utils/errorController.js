
export default (err, req, res, next) => {
    err.statusCode = err.statusCode || 500; //default value set to 500 for internal server error
    err.status = err.status || 'error' //default set to 'error'
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message
    });
};