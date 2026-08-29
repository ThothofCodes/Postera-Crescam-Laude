// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
const router = require('express').Router();
const {
  getRevenue, getSummary, createRevenue, updateRevenue, deleteRevenue,
} = require('../controllers/revenueController');
const { protect, staff } = require('../middleware/auth');

router.use(protect, staff);
router.get('/summary', getSummary);
router.route('/').get(getRevenue).post(createRevenue);
router.route('/:id').put(updateRevenue).delete(deleteRevenue);

module.exports = router;
