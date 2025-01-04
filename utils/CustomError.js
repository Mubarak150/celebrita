class CustomError extends Error {
    constructor (message, statusCode) {
        super(message)
        this.statusCode = statusCode; 
        this.status = statusCode >= 400 && statusCode < 500 ? false : 'error'; 

        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor)
    }
}

const makeError = (message, code, next) => {
    const error = new CustomError(message, code); // bad req. 
    return next(error); 
}

module.exports = {CustomError, makeError}; 