import { validationResult } from 'express-validator';
import ApiError from '../utils/ApiError.js';

/**
 * Middleware: Checks express-validator validation results.
 * Returns structured error response with all validation failures.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
      value: err.value,
    }));

    throw new ApiError(400, 'Validation failed', extractedErrors);
  }

  next();
};

export default validate;
