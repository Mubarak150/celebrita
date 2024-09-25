const User = require('../../models/User');
const Product = require('../../models/Product');
const Order = require('../../models/Order');
const OrderProduct = require('../../models/OrderProduct');
const {notifyAllAdmins} = require('../../utils/socket');
const { Op } = require('sequelize');


// Get orders with status containing 'return'
const getReturnOrdersByUser = async (req, res) => {
  const user_id = req.body.user_id;
  try {
      const orders = await Order.findAll({
          where: {
              user_id,
              status: {
                  [Op.like]: '%return%' // Status contains the word "return"
              }
          },
          include: [{
              model: User,
              attributes: ['id', 'name', 'email']
          }, {
              model: Product,
              attributes: ['id', 'name', 'thumbnail'],
              through: {
                  attributes: ['quantity', 'price_at_order']
              }
          }]
      });
      res.status(200).json({ success: true, data: orders });
  } catch (error) {
      res.status(500).json({ success: false, error: error.message });
  }
};

// Get orders with status that does not contain the word 'return'
const getNonReturnOrdersByUser = async (req, res) => {
  const user_id = req.body.user_id;
  try {
      const orders = await Order.findAll({
          where: {
              user_id,
              status: {
                  [Op.notLike]: '%return%' // Status does not contain the word "return"
              }
          },
          include: [{
              model: User,
              attributes: ['id', 'name', 'email']
          }, {
              model: Product,
              attributes: ['id', 'name', 'thumbnail'],
              through: {
                  attributes: ['quantity', 'price_at_order']
              }
          }]
      });
      res.status(200).json({ success: true, data: orders });
  } catch (error) {
      res.status(500).json({ success: false, error: error.message });
  }
};


// Update Order to return-pending Status if its current status is recieved : done by user
const returnReceivedOrder = async (req, res) => {
    const { id } = req.params; // order id
    const  return_reason  = req.body.return_reason;
    const return_proof_image = req.files && req.files['return_proof_image'] ? req.files['return_proof_image'][0].path : null;

    if(!return_reason || !return_proof_image) {
        return res.status(400).json({ success: false, error: 'reason for return and an image as a proof thereof are mandatory' });
    }
  
    try {
      const order = await Order.findByPk(id);
  
      if (!order) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }

      if(req.body.user_id != order.user_id) {
        return res.status(403).json({ success: false, error: 'This order does not belong to you.' });
      }
  
      if(order.status != 'received') {
        res.status(403).json({status: false, message: "only recieved orders can be returned"})
      } else {
        
        // Process the return_proof_image 
        if (req.files) {
            const image = `/uploads/products/${req.files.return_proof_image[0].filename}`;
            req.body.return_proof_image = image; 
        }
        order.status = 'return-pending';
        order.return_reason = return_reason || null;
        order.return_proof_image = req.body.return_proof_image; // this is still untested and needed to be considered thoroughly...

        let notificationMessage = `an order-return application recieved from user, against order #${order.id}.`;
        notifyAllAdmins(order.id, notificationMessage);

        await order.save();
        res.status(200).json({ success: true, message: "return request placed successfully." });
      }
        
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

// Update Order to return-on-the-way Status if its current status is return-approved: done by user
const returnOnTheWayOrder = async (req, res) => {
  const { id } = req.params; // order id
  const { return_company, return_tracking_id, return_user_account, return_user_account_title, return_user_account_bank } = req.body;

  // Check if all required fields are provided
  if (!return_company || !return_tracking_id || !return_user_account || !return_user_account_title || !return_user_account_bank) {
      return res.status(400).json({ 
          success: false, 
          error: 'Return company, tracking ID, and user account related details for the refund are mandatory.' 
      });
  }

  try {
      // Fetch the order by ID
      const order = await Order.findByPk(id);

      // Check if the order exists
      if (!order) {
          return res.status(404).json({ success: false, error: 'Order not found' });
      }

      // Verify that the order belongs to the user making the request
      if (req.body.user_id != order.user_id) {
          return res.status(403).json({ success: false, error: 'This order does not belong to you.' });
      }

      // Ensure that the order's current status is 'return-approved'
      if (order.status !== 'return-approved') {
          return res.status(403).json({ 
              success: false, 
              message: "Only those orders whose return is approved can be sent back to the company." 
          });
      } else {
          // Update the order with the return details and change the status
          order.status = 'return-on-the-way';
          order.return_company = return_company; 
          order.return_tracking_id = return_tracking_id;
          order.return_user_account = return_user_account;
          order.return_user_account_title = return_user_account_title; 
          order.return_user_account_bank = return_user_account_bank;

          let notificationMessage = `a user has put an order in transit for return against order #${order.id}.`;
          notifyAllAdmins(order.id, notificationMessage);
          // Save the updated order
          await order.save();

          // Respond with success
          res.status(200).json({ 
              success: true, 
              message: "Return-on-the-way status updated successfully." 
          });
      }
      
  } catch (error) {
      // Handle any server errors
      res.status(500).json({ success: false, error: error.message });
  }
};


module.exports = {
    getReturnOrdersByUser,
    getNonReturnOrdersByUser,
    returnReceivedOrder,
    returnOnTheWayOrder,
    // getOrderById
  };