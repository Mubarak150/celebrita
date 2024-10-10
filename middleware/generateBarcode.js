const {sequelize} = require('../config/db'); 
const { QueryTypes } = require('sequelize');

const generateBarcode = async (req, res, next) => {
    try {
      // Step 1: Retrieve the last product's barcode
      const lastProduct = await sequelize.query(
        'SELECT barcode FROM products ORDER BY id DESC LIMIT 1;',
        { type: QueryTypes.SELECT }
      );
  
      let newBarcode;
      
      if (lastProduct.length > 0 && lastProduct[0].barcode) {
        // Step 2: Increment the last barcode
        const lastBarcode = parseInt(lastProduct[0].barcode, 10);
        newBarcode = (lastBarcode + 1).toString().padStart(6, '0');  // Ensure 6 digits, padded with zeros
        console.log(newBarcode); 
      } else {
        // Step 3: If no previous product, start with the initial barcode
        newBarcode = '000001'; // The first barcode
      }
  
      // Step 4: Attach the new barcode to the request body
      req.body.barcode = newBarcode;
  
      // Step 5: Pass control to the next middleware or handler
      next();
    } catch (error) {
      // Handle any errors that may occur during barcode generation
      res.status(500).json({ success: false, message: 'Error generating barcode', error: error.message });
    }
  };
  

module.exports = {generateBarcode}; 