const Cart = require('../../models/Cart');
const CartItem = require('../../models/CartItem');
const Product = require('../../models/Product');
const Order = require('../../models/Order');
const OrderProduct = require('../../models/OrderProduct');

exports.checkout = async (req, res) => {
    try {
      const { user_id, shipping_address, payment_method } = req.body; 
  
      // Find the user's cart
      const cart = await Cart.findOne({ where: { user_id }, include: CartItem });
      if (!cart || cart.CartItems.length === 0) {
        return res.status(400).json({ success: false, message: 'Cart is empty' });
      }
  
      // Calculate total amount
      let totalAmount = 0;
      const cartItems = cart.CartItems;
      for (let item of cartItems) {
        const product = await Product.findByPk(item.product_id);
        totalAmount += product.price * item.quantity;
      }
  
      // Create a new order
      const order = await Order.create({ user_id, total_amount: totalAmount, shipping_address, payment_method });
  
      // Add products to the order
      for (let item of cartItems) {
        const product = await Product.findByPk(item.product_id);
        await OrderProduct.create({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price_at_order: product.price
        });
      }
  
      // Clear the cart after checkout
      await CartItem.destroy({ where: { cart_id: cart.id } });
  
      res.status(201).json({ success: true, data: order });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };
  