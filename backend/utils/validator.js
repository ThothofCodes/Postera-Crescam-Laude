// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// Simple input validator for all POST/PUT endpoints

const validators = {
  email: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
  phone: (val) => /^[0-9+\-\s()]{7,20}$/.test(val),
  url: (val) => /^https?:\/\/.+/.test(val),
  slug: (val) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(val),
  nonempty: (val) => typeof val === 'string' && val.trim().length > 0,
  numeric: (val) => /^[0-9]+$/.test(val),
};

function validate(data, schema) {
  const errors = {};
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors[field] = `${field} is required`;
      continue;
    }
    if (value && rules.type) {
      // eslint-disable-next-line valid-typeof
      if (typeof value !== rules.type) {
        errors[field] = `${field} must be ${rules.type}`;
      }
    }
    if (value && rules.validator && validators[rules.validator]) {
      if (!validators[rules.validator](value)) {
        errors[field] = `${field} is invalid`;
      }
    }
    if (value && rules.minLength && value.length < rules.minLength) {
      errors[field] = `${field} must be at least ${rules.minLength} characters`;
    }
    if (value && rules.maxLength && value.length > rules.maxLength) {
      errors[field] = `${field} must not exceed ${rules.maxLength} characters`;
    }
  }
  return Object.keys(errors).length > 0 ? errors : null;
}

module.exports = { validate, validators };
