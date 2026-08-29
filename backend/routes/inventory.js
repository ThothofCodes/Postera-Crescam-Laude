// Copyright (c) 2026 Thoth of Codes. Licensed under the MIT License.
const express = require('express');
const QRCode = require('qrcode');

const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { upload } = require('../middleware/upload'); // Destructure the upload object
const { protect, authorize } = require('../middleware/auth');
const Inventory = require('../models/Inventory');

// Apply auth protection to all routes
router.use(protect);

// Routes that don't require specific permissions
router.get('/', inventoryController.getAll);
router.get('/low-stock', inventoryController.getLowStock);
router.get('/expiring', inventoryController.getExpiring);
router.get('/:id', inventoryController.getById);

// QR code generation for inventory item
router.get('/:id/qr', async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id).select('name sku _id');
    if (!item) return res.status(404).json({ message: 'Item not found' });
    const qrData = JSON.stringify({ id: item._id, sku: item.sku, name: item.name });
    const dataUri = await QRCode.toDataURL(qrData, { width: 200, margin: 1 });
    res.json({ success: true, dataUri, sku: item.sku, name: item.name });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate QR code' });
  }
});

// Routes that require specific permissions
router.post('/', authorize(['admin', 'SUPER_ADMIN', 'STAFF']), upload.array('attachments', 5), inventoryController.create);
router.patch('/:id', authorize(['admin', 'SUPER_ADMIN', 'STAFF']), upload.array('attachments', 5), inventoryController.update);
router.delete('/:id', authorize(['admin', 'SUPER_ADMIN']), inventoryController.delete);

// Inventory movements
router.post('/movements', authorize(['admin', 'SUPER_ADMIN', 'STAFF']), inventoryController.recordMovement);

module.exports = router;
