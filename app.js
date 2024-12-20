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
const passwordChangeLogRoutes = require('./routes/passwordChangeLogRoutes');
const contactRoutes = require('./routes/contact');
const patientRoutes = require('./routes/reception/routes'); //
const settingsRoutes = require('./routes/settingsRoutes')

// pos v2 route handlers: 
const posV2ProductRoutes = require('./routes/POS-v2/productRoutes')
const posV2SalesCartRoutes = require('./routes/POS-v2/salesCartRoutes') 
const posV2FinalizeSaleRoutes = require('./routes/POS-v2/finalizeSaleRoutes') 
const posV2ReturnSoldProductRoutes = require('./routes/POS-v2/returnSoldProductRoutes')
const posV2TodaySalesAndReturnsRoutes = require('./routes/POS-v2/todaySalesAndReturnsRoutes') 

// pos v2 admin routes
const posV2AdminSalesOverviewRoutes = require('./routes/POS-v2-admin/adminSalesOverviewRoutes')

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
app.use('/api/admin/v1/password-change-logs', passwordChangeLogRoutes);

// III.b settings APIs: 
app.use('/api/protected/v1/settings', settingsRoutes);

// IV. for all APIs: 
app.use('/api/user/v1/notifications', notificationRoutes);
app.use('/api/user/v1/gopayfast', gopayfast);
app.use('/api/contact', contactRoutes);

// V. for POS: 
app.use('/api/pos/v1', pos);

// VI. reception: 
app.use('/api/patients', patientRoutes);


///////////////////////////////////////////////////
// VI>> pos v2 
app.use('/api/pos/v2/products', posV2ProductRoutes);
app.use('/api/pos/v2/sales/cart', posV2SalesCartRoutes);
app.use('/api/pos/v2/sales', posV2FinalizeSaleRoutes);
app.use('/api/pos/v2/return', posV2ReturnSoldProductRoutes);
app.use('/api/pos/v2/summary', posV2TodaySalesAndReturnsRoutes);

// VII>> pos v2 admin 
app.use('/api/pos/v2/admin/summary', posV2AdminSalesOverviewRoutes);
// EXPORTING APP TO SERVER.JS
module.exports = app; 