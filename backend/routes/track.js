// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
//
// Phase 9 market research, Tier 1 #1 — public repair status tracker.
// Deliberately has NO auth middleware: a PCL Centre customer looks up
// their device by job number alone. See trackJobCard() in
// deptModuleController.js for exactly which fields are safe to expose here.
const router = require('express').Router();
const { trackJobCard } = require('../controllers/deptModuleController');

router.get('/jobcard/:jobNumber', trackJobCard);

module.exports = router;
