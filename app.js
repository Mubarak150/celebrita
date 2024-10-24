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

const authRoutes = require('./routes/auth');
const categories = require('./routes/items/categoryRoutes');
const products = require('./routes/items/productRoutes');
const cart = require("./routes/cartAndOrder/addToCartRoutes");
const deliveries = require('./routes/deliveryRoutes');
const order = require("./routes/cartAndOrder/createOrderRoutes");
const orderUser = require("./routes/cartAndOrder/orderUserRoutes");
const orderAdmin = require("./routes/cartAndOrder/orderRoutes");
const invoicesAdmin = require("./routes/cartAndOrder/invoiceRoutes");
const reviews = require('./routes/reviews/userRoutes')
const reviewsAdmin = require('./routes/reviews/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const gopayfast = require('./routes/cartAndOrder/payOrderRoutes'); 
const pos = require('./routes/POS/pos')
const posAdmin = require('./routes/POS/posAdmin')
const contactRoutes = require('./routes/contact');
const patientRoutes = require('./routes/reception/routes');

//  MIDDLEWARES: 
require('dotenv').config();
app.use(express.json());
app.use(morgan('dev'));
// app.use(express.static('./public'))

// Middleware setup
app.use(cors({
    // origin: [process.env.ORIGIN], 
    credentials: true
}));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Ensure uploads directory exists
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



//ROUTES: 
// test route: 
app.get('/', (req, res) => {
    res.status(200).send('latest update: 2024-10-23');
})

// I. auth (registration, signin, and logout): 
app.use('/api/auth', authRoutes);

// II. user APIs
app.use('/api/user/v1/cart', cart);
app.use('/api/user/v1/place-order', order);
app.use('/api/user/v1/orders', orderUser);
app.use('/api/user/v1/reviews', reviews);
app.use('/api/deliveries', deliveries);

// III. Admin APIs:  
app.use('/api/admin/v1/categories', categories);
app.use('/api/admin/v1/products', products);
app.use('/api/admin/v1/orders', orderAdmin);
app.use('/api/admin/v1/invoices', invoicesAdmin);
app.use('/api/admin/v1/reviews', reviewsAdmin);
app.use('/api/admin/v1/pos', posAdmin);

// IV. for all APIs: 
app.use('/api/user/v1/notifications', notificationRoutes);
app.use('/api/user/v1/gopayfast', gopayfast);
app.use('/api/contact', contactRoutes);

// V. for POS: 
app.use('/api/pos/v1', pos);

// VI. reception: 
app.use('/api/patients', patientRoutes);

// EXPORTING APP TO SERVER.JS
module.exports = app; 