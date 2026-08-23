// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
const express = require('express');

const router = express.Router();
const productController = require('../controllers/productController');
const { protect, deptAdminGuard } = require('../middleware/auth');
const { upload } = require('../middleware/upload'); // Destructure the upload object

// Public routes
router.get('/', productController.getProducts); // Changed from getAll to getProducts
router.get('/featured', productController.getFeatured);
router.get('/search', productController.search);
router.get('/slug/:slug', productController.getProductBySlug);
router.get('/:id', productController.getById);

// Protected routes
router.use(protect);

// Admin routes
router.use(deptAdminGuard);

router.post('/', upload.array('images', 5), productController.createProduct); // Changed from create to createProduct
router.put('/:id', upload.array('images', 5), productController.updateProduct); // Changed from update to updateProduct
router.delete('/:id', productController.deleteProduct); // Changed from delete to deleteProduct

module.exports = router;
