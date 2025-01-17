const express = require('express');
const { adminSalesOverview, overviewSalesmen } = require('../../controllers/POS-v2-admin/salesOverview');
const {protect, forAdminOrManager} = require('../../middleware/auth')
const router = express.Router();

// for getting sales overview for a given  date or range thereof... 
router.get('/',  adminSalesOverview); // protect, forAdminOrManager,
router.get('/salesmen',  overviewSalesmen); //protect, forAdminOrManager,

module.exports = router;