require("dotenv").config();
const { CustomError, makeError } = require("./CustomError");

// handle errors in development
const devError = (res, error) => {
  res.status(error.statusCode).json({
    status: error.status,
    message: error.message,
    stackTrace: error.stack,
    error: error,
  });
};

// hanlde errors in production
const prodError = (res, error) => {
  // | #security | is the error operational or not? if not operational i.e. not defined by us and is from server side etc. then dont show its details.
  if (error.isOperational) {
    res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });
  } else {
    res.status(500).json({
      status: "error",
      message: "Something went wrong. Please try again later!",
    });
  }
};

// handle a single sort of error, while in production:
// 1. video 96
const castErrorHandler = (err) => {
  // a type of mongoose error
  msg = `invalid value for the field ${err.path}: ${err.value}`;
  const newError = new CustomError(msg, 400); // bad request
  return newError;
};

// 2. video 97
const duplicateHandler = (err) => {
  const duplicateError = err.errors[0];
  const name = duplicateError.value;
  const column = duplicateError.path;
  const msg = `An entry of ${name} already exists for ${column}.`;
  const newError = new CustomError(msg, 400);
  return newError;
};

// 3. video 98
const validatorErrorHandler = (err) => {
  let errors = Object.values(err.errors).map(
    (val) => val.message.split(".")[1]
  );
  // Replace underscores with spaces in the error messages
  errors = errors.join(". ").replace(/_/g, " ");
  const msg = `incorrect data: ${errors}`;
  const newError = new CustomError(msg, 400);
  return newError;

  // this below is not used for now:
  // for (let key in err.errors) { // this is a for...in loop which loop in key value pairs within an object. key stores the key for each iteration
  //     const { message } = err.errors[key]; // Destructure the message ... with err.errors[key] we are accessing the value of that key in errors object.
  //     const msg = (`Incorrect ${key}: ${message}`);

  //     // here we are taking the first iteration of that loop and returning the error without waiting for the rest of iterations. one error at a time.. haha. jugaarh
  //     const newError = new CustomError(msg, 400) // bad request
  //     return newError
  // }
};

const foreignKeyErrorHandler = (err) => {
  // if (err.code == 'ER_NO_REFERENCED_ROW_2') {
  const msg = `The value for ${err.fields[0]} does not have a match in records.`;
  const newError = new CustomError(msg, 400); // bad request
  return newError;
  // }
  // return err;
};

// video 108:
const jwtExpiredHandler = (err) => {
  return new CustomError("your session has expired! please login again", 401); // unauthorized
};

const jwtErrorHandler = () => {
  return new CustomError("your session credentials are not valid", 401); // unauthorized
};

const zodError = (err) => {
  // console.log(err)
  if (!err.issues) {
    return "An unexpected error occurred.";
  }

  // Get the first error from the issues array
  const firstError = err.issues[0];
  // console.log("i was here")

  // Retrieve the field name and expected type from the first error
  const field = firstError.path?.join(".") || "unknown field";
  const expected = firstError.expected || "required";
  // console.log(field, expected)

  let msg;
  if (firstError.message == "Required") {
    msg = `${field} is required`;
  } else {
    msg = `${field} must be a ${expected}`;
  }

  // Return a formatted message for the first error
  return new CustomError(msg, 400);
};

// main function:
const globalErrorController = (error, req, res, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || "error";

  // note: sending different errors depending on dev env and prod env: in dev env send as much info about errors as possible... while in production env send as little info of the error as possible to avoid hacking or any ill-intended use of the site based on those error messages.
  if (process.env.NODE_ENV === "development") {
    devError(res, error);
  } else if (process.env.NODE_ENV === "production") {
    if (error.name == "CastError") error = castErrorHandler(error); // ObjectId() casting error

    if (error.name == "SequelizeUniqueConstraintError")
      error = duplicateHandler(error); // handling sequelize error for duplicate entry in unique column
    if (error.name == "SequelizeValidationError")
      error = validatorErrorHandler(error); // sequelize validator error
    if (error.name == "TokenExpiredError") error = jwtExpiredHandler(error);
    if (error.name == "JsonWebTokenError") error = jwtErrorHandler(error);
    if (error.name == "SequelizeForeignKeyConstraintError")
      error = foreignKeyErrorHandler(error);
    if (error.name == "ZodError") error = zodError(error);

    prodError(res, error);
  }
};

module.exports = { globalErrorController };
