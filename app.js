// IMPORTS: 
const express = require('express');
const app = express();
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
require('./models/relations');
// const moviesRouter = require('./routes/movies')

const authRoutes = require('./routes/auth');
const categories = require('./routes/items/categoryRoutes');
const products = require('./routes/items/productRoutes');
const cart = require("./routes/cartAndOrder/addToCartRoutes");
const order = require("./routes/cartAndOrder/createOrderRoutes");

//  MIDDLEWARES: 
require('dotenv').config();
app.use(express.json());
app.use(morgan('dev'));
// app.use(express.static('./public'))

// Middleware setup
app.use(cors({
    origin: [process.env.ORIGIN],
    credentials: true
}));
app.use(cookieParser());
app.use(bodyParser.json());

// Ensure uploads directory exists
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//ROUTES: 
// I. auth (registration, signin, and logout): 
app.use('/api/auth', authRoutes);
app.use('/api/user/v1/:user_id/cart', cart);
app.use('/api/user/v1/:user_id/order', order);

// II. Admin:  
app.use('/api/admin/v1/categories', categories);
app.use('/api/admin/v1/products', products);



// EXPORTING APP TO SERVER.JS
module.exports = app; 