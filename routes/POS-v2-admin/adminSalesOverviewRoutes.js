const express = require('express');
const { adminSalesOverview, overviewSalesmen } = require('../../controllers/POS-v2-admin/salesOverview');
const {protect, isUserAdmin} = require('../../middleware/auth')
const router = express.Router();

// for getting sales overview for a given  // 
router.get('/', adminSalesOverview);
router.get('/salesmen', overviewSalesmen);

module.exports = router;