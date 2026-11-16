const globalErrorHandler = (err, req, res, next) => {

    // Duplicate key (e.g. same email registered twice at the same moment)
    if (err.code === 11000) {
        err.statusCode = 409;
        err.status = "fail";
        err.message = "This value already exists";
    }

    // Upload problems (file too big / not an image) are the user's mistake, not a server error
    if (err.name === "MulterError" || err.message === "Only images are allowed") {
        err.statusCode = 400;
        err.status = "fail";

        if (err.code === "LIMIT_FILE_SIZE") {
            err.message = "The image is too large (max 5 MB)";
        }
    }

    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        status: err.status || "error",
        message: err.message || "Internal Server Error"
    });

};

export default globalErrorHandler;