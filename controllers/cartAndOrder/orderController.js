const User = require('../../models/User');
const Product = require('../../models/Product');
const Order = require('../../models/Order');
const OrderProduct = require('../../models/OrderProduct');
const Notification = require('../../models/Notification'); 
const io = require('../socket'); // importiiiiiiiiiing Socket.IO instance

// Get Orders by Status
const getOrdersByStatus = async (req, res, status) => {
  try {
    const orders = await Order.findAll({
      where: { status },
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

// Get Order by ID
const getOrderById = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await Order.findByPk(id, {
      include: [{ model: User }, { model: Product }]
    });
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update Order Status (for Approve/Reject/Receive)
const updateOrderStatus = async (req, res) => {
  const { id, status } = req.params;
  const { rejection_reason, exp_delivery_date, courier_company, tracking_id, return_rejection_reason, return_address } = req.body;

  try {
    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    let notificationMessage = '';

    switch (status) {
      case 'approve':
        if(order.status == 'approved') {
          res.status(400).json({status: false, message: "order already approved"})
        } else {
          order.status = 'approved';
          order.exp_delivery_date = exp_delivery_date || null;
          notificationMessage = `Your order #${order.id} has been approved and you may expect its delivery on/before ${order.exp_delivery_date}.`;
        }
        
        break;
    
      case 'reject':
        if(order.status == 'rejected') {
          res.status(400).json({status: false, message: "order already rejected"})
        } else {
          order.status = 'rejected';
          order.rejection_reason = rejection_reason;
          notificationMessage = `Your order #${order.id} has been rejected. the rejection reason provided by our team is: ${order.rejection_reason}.`;

          // Fetch all the OrderProducts associated with this order
          const orderProducts = await OrderProduct.findAll({ where: { order_id: order.id } });

          // Iterate through each OrderProduct and update the related Product's quantity
          for (const orderProduct of orderProducts) {
            // Find the product related to this orderProduct
            const product = await Product.findOne({ where: { id: orderProduct.product_id } });

            if (product) {
              // Increase the product's quantity by the orderProduct quantity
              product.quantity += orderProduct.quantity;
              
              // Save the updated product quantity
              await product.save();
            }
          }
        }
        break;
    
      case 'on-the-way':
        if(order.status == 'on-the-way') {
          res.status(400).json({status: false, message: "order already in transit"})
        } else {
          order.status = 'on-the-way';
          order.courier_company = courier_company;
          order.tracking_id = tracking_id;
          notificationMessage = `Your order #${order.id} has been dispatched successfully via ${order.courier_company} with the tracking ID: ${order.tracking_id}.`;
        }
        break;
    
      case 'receive': {
        if(order.status == 'received') {
          res.status(400).json({status: false, message: "order already received"})
        } else {
          // Set status to 'received' and log receipt date
          const currentTime = new Date();
          order.status = 'received';
          order.reciept_date = currentTime;
      
          // Set the return expiry date to 4 days after receipt date
          const returnExpiryDate = new Date(currentTime);
          returnExpiryDate.setDate(returnExpiryDate.getDate() + 4);
          order.return_expiry_date = returnExpiryDate;

          notificationMessage = `Your order #${order.id} has reached successfully. Thank you for shopping at Celebrita.`;
      
          // Logic for automatically marking the order as 'completed' if return status not changed within 4 days
          setTimeout(async () => {
            const updatedOrder = await Order.findByPk(order.id); // Fetch the latest order state
            if (updatedOrder.status === 'received') {
              updatedOrder.status = 'completed';
              await updatedOrder.save(); // Save the updated status
              console.log(`Order ID ${updatedOrder.id} automatically marked as 'completed' after return expiry.`);
            }
          }, 4 * 24 * 60 * 60 * 1000); // 4 days in milliseconds
        }
        break;
      }
    
      case 'return-reject':
        // Admin rejects the return, setting the status to 'completed'
        order.status = 'completed';
        order.return_rejection_reason = return_rejection_reason || 'Return rejected by admin';

        notificationMessage = `Your request to return order #${order.id} has been rejected because: ${order.rejection_reason}`;
        break;

      case 'return-approve':
        // Admin rejects the return, setting the status to 'completed'
        order.status = 'return-approved';
        order.return_address = return_address;

        notificationMessage = `Your request to return order #${order.id} has been approved. you may return the order to ${order.return_address}.`;
        break;
      
      case 'return-receive':
        if(order.status == "return-received") {
          res.status(400).json({status: false, message: "order already received from return"})
        } else {
          // Admin rejects the return, setting the status to 'completed'
          order.status = 'return-received';
          notificationMessage = `Your return of order #${order.id} reached our warehouse.`;

          // Find all the products associated with this order
          const orderProducts = await OrderProduct.findAll({ where: { order_id: order.id } });
        
          if (orderProducts && orderProducts.length > 0) {
            for (const orderProduct of orderProducts) {
              // Get the product from the orderProduct
              const product = await Product.findByPk(orderProduct.product_id);
              
              if (product) {
                // Increment the returned_quantity by the quantity of the returned product
                product.returned_quantity += orderProduct.quantity;
                
                // Save the updated product
                await product.save();
              }
            }
          }
        }
        
    
        break;
    
      case 'completed':
        // Manually mark the order as completed
        order.status = 'completed';
        break;
    
      default:
        return res.status(400).json({ success: false, message: 'Invalid order status' });
    }
    

    await order.save();

    // Create a notification
    const notification = await Notification.create({
      user_id: order.user_id, 
      message: notificationMessage,
    });

    // Emit the notification to the user via Socket.IO
    io.to(`user_${order.user_id}`).emit('notification', notification);

    res.status(200).json({ success: true, data: order, notification: {message: notificationMessage, user: order.user_id} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getOrdersByStatus,
  updateOrderStatus,
  getOrderById
};
