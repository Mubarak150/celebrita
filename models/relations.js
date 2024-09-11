const {sequelize} = require('../config/db')
const Cart = require('./Cart');
const Product = require('./Product');
const CartItem = require('./CartItem');

// Associations
Cart.hasMany(CartItem, { foreignKey: 'cart_id' });
Product.hasMany(CartItem, { foreignKey: 'product_id' });
CartItem.belongsTo(Cart, { foreignKey: 'cart_id' });
CartItem.belongsTo(Product, { foreignKey: 'product_id' });

// Sync all models (this should be done only once)
sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database synchronized');
  })
  .catch(error => {
    console.error('Error syncing database:', error);
  });

module.exports = { Cart, Product, CartItem };
