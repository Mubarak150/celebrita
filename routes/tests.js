const express = require('express');
const router = express.Router();

const {
    createTest
  } = require('../controllers/items/tests');
  
  router.post('/', createTest);
  
  
  module.exports = router;