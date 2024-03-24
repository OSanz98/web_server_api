const catchAsync = fn => {
    // created an anonymous function which is returned to objects that this is assigned to.
    // this allows those objects to then pass the req, res, and next objects to this one
    return (req, res, next) => {
        /**
         * Because we are passing an async function to fn, and async functions return a Promise, we have access
         * to the catch function, we can also then pass the error to the next function.
         * Passing an error to the next function will tell express to automatically execute
         * the global error handling middleware.
         */
        fn(req, res, next).catch(err => next(err))
    };
};
export default catchAsync;