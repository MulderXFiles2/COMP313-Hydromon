/**
 * auth.schema.js
 *
 * Validation schemas for authentication requests.
 */

import Joi from "joi";

const passwordRequirementsMessage =
  "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number.";

const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .required()
  .custom((value, helpers) => {
    const hasLowercase = /[a-z]/.test(value);
    const hasUppercase = /[A-Z]/.test(value);
    const hasNumber = /[0-9]/.test(value);

    if (!hasLowercase || !hasUppercase || !hasNumber) {
      return helpers.error("password.requirements");
    }

    return value;
  })
  .messages({
    "string.empty": "Password is required",
    "string.min": passwordRequirementsMessage,
    "string.max": "Password must be at most 128 characters long",
    "any.required": "Password is required",
    "password.requirements": passwordRequirementsMessage,
  });

export const registerSchema = Joi.object({
  userName: Joi.string().trim().min(2).max(50).required().messages({
    "string.empty": "Username is required",
    "string.min": "Username must be at least 2 characters long",
    "string.max": "Username must be at most 50 characters long",
    "any.required": "Username is required",
  }),
  email: Joi.string().email().trim().required().messages({
    "string.email": "Email must be valid",
    "string.empty": "Email is required",
    "any.required": "Email is required",
  }),
  password: passwordSchema,
  confirmPassword: Joi.string().required().valid(Joi.ref("password")).messages({
    "any.only": "Confirm password must match password",
    "string.empty": "Confirm password is required",
    "any.required": "Confirm password is required",
  }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().trim().required().messages({
    "string.email": "Email must be valid",
    "string.empty": "Email is required",
    "any.required": "Email is required",
  }),
  password: Joi.string().min(8).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 8 characters long",
    "any.required": "Password is required",
  }),
});