const globalErrorHandler = (err, req, res, next) => {

    // Duplicate key (e.g. same email registered twice at the same moment)
    if (err.code === 11000) {
        err.statusCode = 409;
        err.status = "fail";
        err.message = "This value already exists";
    }

    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        status: err.status || "error",
        message: err.message || "Internal Server Error"
    });

};

export default globalErrorHandler;