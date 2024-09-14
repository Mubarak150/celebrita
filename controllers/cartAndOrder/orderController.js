const User = require('../../models/User');
const CartItem = require('../../models/CartItem');
const Product = require('../../models/Product');
const Order = require('../../models/Order');

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
  console.log(id, status, "id", "status")
  const { rejection_reason, exp_delivery_date, courier_company, tracking_id } = req.body;

  try {
    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    switch (status) {
      case 'approve':
        order.status = 'approved';
        order.exp_delivery_date = exp_delivery_date || null;
        break;
    
      case 'reject':
        order.status = 'rejected';
        order.rejection_reason = rejection_reason;
        break;
    
      case 'on-the-way':
        order.status = 'on the way';
        order.courier_company = courier_company;
        order.tracking_id = tracking_id;
        break;
    
      case 'receive': {
        // Set status to 'received' and log receipt date
        const currentTime = new Date();
        order.status = 'received';
        order.reciept_date = currentTime;
    
        // Set the return expiry date to 4 days after receipt date
        const returnExpiryDate = new Date(currentTime);
        returnExpiryDate.setDate(returnExpiryDate.getDate() + 4);
        order.return_expiry_date = returnExpiryDate;
    
        // Logic for automatically marking the order as 'completed' if return status not changed within 4 days
        setTimeout(async () => {
          const updatedOrder = await Order.findByPk(order.id); // Fetch the latest order state
          if (updatedOrder.status === 'received') {
            updatedOrder.status = 'completed';
            await updatedOrder.save(); // Save the updated status
            console.log(`Order ID ${updatedOrder.id} automatically marked as 'completed' after return expiry.`);
          }
        }, 4 * 24 * 60 * 60 * 1000); // 4 days in milliseconds
        break;
      }
    
      case 'pending-return':
        // Ensure the user provides a return reason and proof of return image
        if (!return_reason || !return_proof_image) {
          return res.status(400).json({ success: false, message: 'Return reason and proof image are required for return.' });
        }
    
        // Set the status to 'pending-return' and save the return reason and proof
        order.status = 'pending-return';
        order.return_reason = return_reason;
        order.return_proof_image = return_proof_image;
        break;
    
      case 'reject-return':
        // Admin rejects the return, setting the status to 'completed'
        order.status = 'completed';
        order.return_rejection_reason = return_rejection_reason || 'Return rejected by admin';
        break;
    
      case 'completed':
        // Manually mark the order as completed
        order.status = 'completed';
        break;
    
      default:
        return res.status(400).json({ success: false, message: 'Invalid order status' });
    }
    

    await order.save();
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getOrdersByStatus,
  updateOrderStatus,
  getOrderById
};
