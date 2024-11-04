const {sequelize} = require('../config/db');
const User = require('./User');
const Order = require('./Order');
const OrderProduct = require('./OrderProduct');
const Cart = require('./Cart');
const SalesCart = require('./SalesCart');
const Product = require('./Product');
const CartItem = require('./CartItem');
const SalesCartItems = require('./SalesCartItems');
const Invoice = require('./Invoice'); 
const Review = require('./Review'); 
const Notification = require('./Notification');
const Ticket = require('./Ticket');
const TicketMessage = require('./TicketMessage');  
const Shift = require('./Shift');
const ShiftSale = require('./ShiftSale');
const POSSale = require('./POSSale'); 
const POSSaleProduct = require("./POSSaleProduct")
const SaleReturn = require('./SaleReturn')
const SaleReturnProduct = require('./SaleReturnProduct')

// Associations of:
// cart: products, cartItems, 
Cart.hasMany(CartItem, { foreignKey: 'cart_id' });
Product.hasMany(CartItem, { foreignKey: 'product_id' });
CartItem.belongsTo(Cart, { foreignKey: 'cart_id' });
CartItem.belongsTo(Product, { foreignKey: 'product_id' });

// cart: products, cartItems, 
SalesCart.hasMany(SalesCartItems, { foreignKey: 'sales_cart_id' });
Product.hasMany(SalesCartItems, { foreignKey: 'product_id' });
SalesCartItems.belongsTo(SalesCart, { foreignKey: 'sales_cart_id' });
SalesCartItems.belongsTo(Product, { foreignKey: 'product_id' });

// order: users, products, order_products
User.hasMany(Order, { foreignKey: 'user_id' });
Order.belongsTo(User, { foreignKey: 'user_id' });
Order.belongsToMany(Product, { through: OrderProduct, foreignKey: 'order_id' });
Product.belongsToMany(Order, { through: OrderProduct, foreignKey: 'product_id' });

// A Product has many OrderProducts
Product.hasMany(OrderProduct, { foreignKey: 'product_id' });
OrderProduct.belongsTo(Product, { foreignKey: 'product_id' });

// Order model
Order.hasOne(Invoice, { foreignKey: 'order_id' });
Invoice.belongsTo(Order, { foreignKey: 'order_id' });

Order.hasMany(OrderProduct, { foreignKey: 'order_id' });
Order.belongsTo(User, { foreignKey: 'user_id' });

OrderProduct.belongsTo(Order, { foreignKey: 'order_id' });
OrderProduct.belongsTo(Product, { foreignKey: 'product_id' });


// pos sales
POSSale.hasMany(POSSaleProduct, { foreignKey: 'sale_id', as: 'sale_products' }); // Alias added here

// Assuming you also have User model
// Order.belongsTo(User, { foreignKey: 'user_id' });

POSSaleProduct.belongsTo(POSSale, { foreignKey: 'sale_id' }); // Alias for POSSale
POSSaleProduct.belongsTo(Product, { foreignKey: 'product_id', as: 'product' }); // Alias for Product


Product.hasMany(OrderProduct, { foreignKey: 'product_id' });

/////
// SaleReturn.hasMany(SaleReturnProduct, { foreignKey: 'sale_return_id', as: 'return_products' });
// SaleReturnProduct.belongsTo(SaleReturn, { foreignKey: 'sale_return_id' }); // Alias for POSSale
// Product.hasMany(SaleReturnProduct, {foreignKey: 'product_id'})
// SaleReturnProduct.belongsTo(POSSaleProduct, { foreignKey: 'product_id', as: 'product' }); // Alias for Product

// SaleReturn has many SaleReturnProducts
SaleReturn.hasMany(SaleReturnProduct, { foreignKey: 'sale_return_id', as: 'return_products' });
SaleReturnProduct.belongsTo(SaleReturn, { foreignKey: 'sale_return_id' });

// POSSaleProducts are related to SaleReturnProducts (if applicable in your schema)
POSSaleProduct.hasMany(SaleReturnProduct, { foreignKey: 'product_id', as: 'sale_products' });
SaleReturnProduct.belongsTo(POSSaleProduct, { foreignKey: 'product_id', as: 'sale_products' });

// // Each SaleReturnProduct is related to a Product
// Product.hasMany(SaleReturnProduct, { foreignKey: 'product_id', as: 'return_products' }); 
// SaleReturnProduct.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// reviews: 
// User has many Reviews, and a Review belongs to one User
User.hasMany(Review, { foreignKey: 'user_id' });
Review.belongsTo(User, { foreignKey: 'user_id' });

// Product has many Reviews, and a Review belongs to one Product
Product.hasMany(Review, { foreignKey: 'product_id' });
Review.belongsTo(Product, { foreignKey: 'product_id' });

// Notifications: 
User.hasMany(Notification, { foreignKey: 'user_id' });
Notification.belongsTo(User, { foreignKey: 'user_id' });

// User and Ticket Relationship
// A User can have many Tickets, and a Ticket belongs to a single User
User.hasMany(Ticket, {
    foreignKey: 'user_id',
    onDelete: 'CASCADE'
  });
  Ticket.belongsTo(User, {
    foreignKey: 'user_id'
  });
  
  // Ticket and TicketMessage Relationship
  // A Ticket can have many TicketMessages, and a TicketMessage belongs to a single Ticket
  Ticket.hasMany(TicketMessage, {
    foreignKey: 'ticket_id',
    onDelete: 'CASCADE'
  });
  TicketMessage.belongsTo(Ticket, {
    foreignKey: 'ticket_id'
  });
  
  // User and TicketMessage Relationship
  // A User can send many TicketMessages, and a TicketMessage is sent by a single User (either an admin or the ticket creator)
  User.hasMany(TicketMessage, {
    foreignKey: 'sender_id',
    onDelete: 'CASCADE'
  });
  TicketMessage.belongsTo(User, {
    foreignKey: 'sender_id'
  });

 // Defining associations
ShiftSale.belongsTo(Shift, { foreignKey: 'shift_id' });
ShiftSale.belongsTo(Product, { foreignKey: 'product_id' });

Shift.belongsTo(User, {
  foreignKey: 'user_id'
});
  


// Sync all models (this should be done only once)
// sequelize.sync({ alter: true })
//   .then(() => {
//     console.log('Database synchronized');
//   })
//   .catch(error => {
//     console.error('Error syncing database:', error);
//   });

module.exports = { Cart, Product, CartItem };
