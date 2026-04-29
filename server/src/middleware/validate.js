/**
 * validate.js
 *
 * Request validation middleware.
 * Applies schema validation to request bodies, params, and queries
 * before controllers are executed.
 *
 * Prevents malformed data from reaching business logic.
 */

export function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((detail) => detail.message);

      return res.status(400).json({
        message: details[0] || "Validation failed",
        details,
      });
    }

    req.body = value;
    next();
  };
}
