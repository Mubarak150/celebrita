const {sequelize} = require('../config/db');
const User = require('./User');
const Order = require('./Order');
const OrderProduct = require('./OrderProduct');
const Cart = require('./Cart');
const Product = require('./Product');
const CartItem = require('./CartItem');

// Associations of:
// cart: products, cartItems, 
Cart.hasMany(CartItem, { foreignKey: 'cart_id' });
Product.hasMany(CartItem, { foreignKey: 'product_id' });
CartItem.belongsTo(Cart, { foreignKey: 'cart_id' });
CartItem.belongsTo(Product, { foreignKey: 'product_id' });

// order: users, products, order_products
User.hasMany(Order, { foreignKey: 'user_id' });
Order.belongsTo(User, { foreignKey: 'user_id' });
Order.belongsToMany(Product, { through: OrderProduct, foreignKey: 'order_id' });
Product.belongsToMany(Order, { through: OrderProduct, foreignKey: 'product_id' });

// A Product has many OrderProducts
Product.hasMany(OrderProduct, { foreignKey: 'product_id' });
OrderProduct.belongsTo(Product, { foreignKey: 'product_id' });




// Sync all models (this should be done only once)
sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database synchronized');
  })
  .catch(error => {
    console.error('Error syncing database:', error);
  });

module.exports = { Cart, Product, CartItem };
