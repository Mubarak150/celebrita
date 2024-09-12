const User = require('../../models/User');
const CartItem = require('../../models/CartItem');
const Product = require('../../models/Product');
const Order = require('../../models/Order');

// Get Orders by Status
const getOrdersByStatus = async (req, res, status) => {
  try {
    const orders = await Order.findAll({
      where: { status },
      include: [{ model: User }, { model: Product }]
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
  const { id } = req.params;
  const { status, rejection_reason, exp_delivery_date, courier_company, tracking_id } = req.body;

  try {
    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Update based on the status
    if (status === 'approved') {
      order.status = 'approved';
      order.exp_delivery_date = exp_delivery_date || null;
    } else if (status === 'rejected') {
      order.status = 'rejected';
      order.rejection_reason = rejection_reason;
    } else if (status === 'on the way') {
      order.status = 'on the way';
      order.courier_company = courier_company;
      order.tracking_id = tracking_id;
    } else if (status === 'received') {
      order.status = 'received';
      // Logic to update receipt and invoice can go here.
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
