// IMPORTS: 
const express = require('express');
const app = express();
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
// const moviesRouter = require('./routes/movies')

const authRoutes = require('./routes/auth');
const categories = require('./routes/items/categoryRoutes');

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
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

//ROUTES: 
// I. auth (registration, signin, and logout): 
app.use('/api/auth', authRoutes);

// II. Admin:  
app.use('/api/admin/v1/categories', categories);


// EXPORTING APP TO SERVER.JS
module.exports = app; 