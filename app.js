// IMPORTS:
const express = require("express");
const app = express();
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const xss = require("xss-clean");
const hpp = require("hpp");
require("./models/relations");
const { CustomError } = require("./utils/CustomError");
const { globalErrorController } = require("./utils/globalErrorController");

const authRoutes = require("./routes/auth");
const categories = require("./routes/items/categoryRoutes");
const products = require("./routes/items/productRoutes");
const cart = require("./routes/cartAndOrder/addToCartRoutes");
const deliveries = require("./routes/deliveryRoutes");
const order = require("./routes/cartAndOrder/createOrderRoutes");
const orderUser = require("./routes/cartAndOrder/orderUserRoutes");
const orderAdmin = require("./routes/cartAndOrder/orderRoutes");
const invoicesAdmin = require("./routes/cartAndOrder/invoiceRoutes");
const reviews = require("./routes/reviews/userRoutes");
const reviewsAdmin = require("./routes/reviews/adminRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const gopayfast = require("./routes/cartAndOrder/payOrderRoutes");
const pos = require("./routes/POS/pos");
const posAdmin = require("./routes/POS/posAdmin");
const passwordChangeLogRoutes = require("./routes/passwordChangeLogRoutes");
const contactRoutes = require("./routes/contact");
const patientRoutes = require("./routes/reception/routes"); //
const settingsRoutes = require("./routes/settingsRoutes");

// pos v2 route handlers:
const posV2ProductRoutes = require("./routes/POS-v2/productRoutes");
const posV2SalesCartRoutes = require("./routes/POS-v2/salesCartRoutes");
const posV2FinalizeSaleRoutes = require("./routes/POS-v2/finalizeSaleRoutes");
const posV2ReturnSoldProductRoutes = require("./routes/POS-v2/returnSoldProductRoutes");
const posV2TodaySalesAndReturnsRoutes = require("./routes/POS-v2/todaySalesAndReturnsRoutes");

// pos v2 admin routes
const posV2AdminSalesOverviewRoutes = require("./routes/POS-v2-admin/adminSalesOverviewRoutes");

//  MIDDLEWARES:

app.use(helmet()); // for adding security headers to requests

// limiter sets a max amount of req. from an IP in a specified amount of time
let limiter = rateLimit({
  max: 30, // 3 req max
  windowMs: 1000 * 60 * 60, // per hour
  message:
    "we have recieved too many requests from this IP, try again in a while", // message shown when limit reaches
});

app.use("/api", limiter);

app.use(express.json({ limit: "10kb" })); // have some research on what should be the limit? it is for denial of service attack.

app.use(xss()); // against malicious js in req.

// app.use(hpp({ whitelist: ["duration", "directors", "price"] }));

require("dotenv").config();
app.use(express.json());
app.use(morgan("dev"));
// app.use(express.static('./public'))

// Middleware setup
app.use(
  cors({
    origin: [process.env.ORIGIN],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// : :: ::: :: : for static files like product images : :: ::: :: :
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//ROUTES:
// test route:
app.get("/", (req, res) => {
  res.status(200).send("latest update: 2024-10-23");
});

// I. auth (registration, signin, and logout):
app.use("/api/auth", authRoutes);

// II. user APIs
app.use("/api/user/v2/cart", cart);
app.use("/api/user/v2/place-order", order);
app.use("/api/v1/orders", orderUser);
app.use("/reviews", reviews);
app.use("/api/deliveries", deliveries);

// III. Admin APIs:
app.use("/api/v2/categories", categories);
app.use("/api/v2/products", products);
app.use("/api/v1/admin/orders", orderAdmin);
app.use("/api/admin/v1/invoices", invoicesAdmin);
app.use("/admin/reviews", reviewsAdmin); // v2
app.use("/api/admin/v1/pos", posAdmin);
app.use("/api/admin/v1/password-change-logs", passwordChangeLogRoutes);

// III.b settings APIs:
app.use("/api/protected/v1/settings", settingsRoutes);

// IV. for all APIs:
app.use("/api/user/v1/notifications", notificationRoutes);
app.use("/api/user/v1/gopayfast", gopayfast);
app.use("/api/contact", contactRoutes);

// V. for POS:
app.use("/api/pos/v1", pos);

// VI. reception:
app.use("/api/patients", patientRoutes);

///////////////////////////////////////////////////
// VI>> pos v2
app.use("/api/pos/v2/products", posV2ProductRoutes);
app.use("/api/pos/v2/sales/cart", posV2SalesCartRoutes);
app.use("/api/pos/v2/sales", posV2FinalizeSaleRoutes);
app.use("/api/pos/v2/return", posV2ReturnSoldProductRoutes);
app.use("/api/pos/v2/summary", posV2TodaySalesAndReturnsRoutes);

// VII>> pos v2 admin
app.use("/api/pos/v2/admin/summary", posV2AdminSalesOverviewRoutes);

// default route: this route SHALL be placed below all the defined routes...
app.all("*", (req, res, next) => {
  const error = new CustomError(
    `the route ${req.originalUrl} does not exist on this server.`,
    404
  );
  next(error);
});

// global Error Controller
app.use(globalErrorController);
// EXPORTING APP TO SERVER.JS
module.exports = app;
