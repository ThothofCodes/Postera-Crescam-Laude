// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
// Request ID middleware — generates a unique X-Request-Id for every inbound request.

const crypto = require('crypto');

const requestId = (req, res, next) => {
  const id = req.headers['x-request-id'] || crypto.randomUUID();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
};

module.exports = requestId;
