const {sequelize} = require('../config/db');
const User = require('./User');
const Order = require('./Order');
const OrderProduct = require('./OrderProduct');
const Cart = require('./Cart');
const Product = require('./Product');
const CartItem = require('./CartItem');
const Invoice = require('./Invoice'); 
const Review = require('./Review'); 
const Notification = require('./Notification');
const Ticket = require('./Ticket');
const TicketMessage = require('./TicketMessage');  
const ShiftSale = require('./ShiftSale');

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

// Order model
Order.hasOne(Invoice, { foreignKey: 'order_id' });
Invoice.belongsTo(Order, { foreignKey: 'order_id' });

Order.hasMany(OrderProduct, { foreignKey: 'order_id' });
Order.belongsTo(User, { foreignKey: 'user_id' });

OrderProduct.belongsTo(Order, { foreignKey: 'order_id' });
OrderProduct.belongsTo(Product, { foreignKey: 'product_id' });

Product.hasMany(OrderProduct, { foreignKey: 'product_id' });

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

  // Associations
// Product.associate({ ShiftSale });
// ShiftSale.associate({ Product });
  


// Sync all models (this should be done only once)
// sequelize.sync({ alter: true })
//   .then(() => {
//     console.log('Database synchronized');
//   })
//   .catch(error => {
//     console.error('Error syncing database:', error);
//   });

module.exports = { Cart, Product, CartItem };
