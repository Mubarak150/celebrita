const express = require('express');
const router = express.Router();
 const {protect, checkSignIn} = require('../middleware/auth');
const {
  createDelivery,
  getAllDeliveries,
  getDeliveryById,
  updateDeliveryById,
  deleteDeliveryById,
} = require('../controllers/deliveryController');

router.post('/', protect, createDelivery);
router.get('/', protect, getAllDeliveries);
router.get('/:id', protect, getDeliveryById);
router.patch('/:id', protect, updateDeliveryById);
router.delete('/:id', protect, deleteDeliveryById);

module.exports = router;