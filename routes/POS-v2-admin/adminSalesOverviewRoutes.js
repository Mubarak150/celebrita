const express = require('express');
const { adminSalesOverview, overviewSalesmen } = require('../../controllers/POS-v2-admin/salesOverview');
const {protect, isUserAdmin} = require('../../middleware/auth')
const router = express.Router();

// for getting sales overview for a given  // 
router.get('/', protect, isUserAdmin, adminSalesOverview);
router.get('/salesmen', protect, isUserAdmin, overviewSalesmen);

module.exports = router;