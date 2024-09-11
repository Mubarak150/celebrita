// Add product to cart
exports.addToCart = async (req, res) => {
    try {
      const { user_id, product_id, quantity } = req.body;
      
      // Find the user's cart
      let cart = await Cart.findOne({ where: { user_id } });
      if (!cart) {
        cart = await Cart.create({ user_id });
      }
  
      // Check if the product already exists in the cart
      let cartItem = await CartItem.findOne({ where: { cart_id: cart.id, product_id } });
      if (cartItem) {
        // Update quantity if it exists
        cartItem.quantity += quantity;
        await cartItem.save();
      } else {
        // Add a new cart item
        await CartItem.create({ cart_id: cart.id, product_id, quantity });
      }
  
      res.status(201).json({ success: true, message: 'Product added to cart' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };
  