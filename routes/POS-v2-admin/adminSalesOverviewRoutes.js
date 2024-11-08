const express = require('express');
const { adminSalesOverview } = require('../../controllers/POS-v2-admin/salesOverview');
const {protect, isUserAdmin} = require('../../middleware/auth')
const router = express.Router();

// for getting sales overview for a given 
router.get('/', adminSalesOverview);

module.exports = router;