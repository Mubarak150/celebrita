const express = require('express');
const router = express.Router();
const { getPasswordChangeLogs } = require('../controllers/passwordChangeLogController'); 
const {protect, isUserAdmin} = require('../middleware/auth');


// Route to get all password change logs
router.get('/', protect, isUserAdmin, getPasswordChangeLogs);

module.exports = router;