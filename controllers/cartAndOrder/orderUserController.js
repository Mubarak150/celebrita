const User = require('../../models/User');
const Product = require('../../models/Product');
const Order = require('../../models/Order');
const OrderProduct = require('../../models/OrderProduct');

// Get Orders by Status
const getOrdersByUser = async (req, res) => {
    const user_id = req.body.user_id;
  try {
    const orders = await Order.findAll({
      where: { user_id },
      include: [{
         model: User,
         attributes: ['id', 'name', 'email']
        }, 
        { 
          model: Product,
          attributes: ['id', 'name', 'thumbnail'],
          through: {
            attributes: ['quantity', 'price_at_order'] // Include only these attributes from the OrderProduct table
          }
         }
        ]
    });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update Order to return-pending Status if its current status is recieved : done by user
const returnReceivedOrder = async (req, res) => {
    const { id } = req.params; // order id
    const { return_reason, return_proof_image } = req.body;

    if(!return_reason || !return_proof_image) {
        return res.status(400).json({ success: false, error: 'reason for return and an image as a proof thereof are mandatory' });
    }
  
    try {
      const order = await Order.findByPk(id);
  
      if (!order) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }
  

        if(order.status != 'received') {
        res.status(400).json({status: false, message: "only recieved orders can be returned"})
        } else {
        
        // Process the return_proof_image 
        if (req.file) {
            const image = `/uploads/products/${req.file.filename}`;
            req.body.return_proof_image = image; 
            console.log("return_proof_image:", req.body.return_proof_image)
        }
        order.status = 'return-pending';
        order.return_reason = return_reason || null;
        order.return_proof_image = req.body.return_proof_image; // this is still untested and needed to be considered thoroughly...
        }
        // find a way to add the image link to the table of order... and add its image to /uploads
          
      await order.save();
      res.status(200).json({ success: true, message: "return request placed successfully." });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

module.exports = {
    getOrdersByUser,
    returnReceivedOrder,
    // getOrderById
  };