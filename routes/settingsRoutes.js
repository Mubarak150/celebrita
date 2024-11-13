const express = require('express');
const { updateThreshold } = require('../controllers/settingsController');
const router = express.Router();
const { protect, forAdminOrManager } = require('../middleware/auth');

router.patch("/update-threshold", updateThreshold); // protect, forAdminOrManager, 

module.exports = router;