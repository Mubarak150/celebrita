const User = require("../../models/User");
const Product = require("../../models/Product");
const Order = require("../../models/Order"); // importiiiiiiiiiing Socket.IO instance
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const { getAll, sendSuccess } = require("../../utils/helpers");
const ApiFeatures = require("../../utils/ApiFeatures");
const { makeError } = require("../../utils/CustomError");

/**
                          |**************************************************|
                          |**************** UTILITY FUNC.  ******************|
                          |**************************************************|
 */
const readAllInvoices = async (req, res, next, where = {}) => {
  const features = new ApiFeatures(Order, {}, req.query).filter();
  (features.queryOptions.attributes = [
    "id",
    "invoice_number",
    "total_amount",
    "amount_with_delivery",
    "status",
    "city",
    "shipping_address",
    "user_contact",
    "payment_type",
    "payment_status",
    "createdAt",
  ]),
    (features.queryOptions.where = {
      ...features.queryOptions.where,
      ...where,
    });
  features.queryOptions.include = [
    {
      model: User,
      attributes: ["name", "email"],
    },
    {
      model: Product,
      attributes: ["name", "thumbnail"],
      through: {
        attributes: ["quantity", "price_at_order"],
      },
    },
  ];

  features.sort();
  await features.paginate();

  const results = await Order.findAll(features.queryOptions);

  return {
    results,
    metadata: features.paginationMetadata,
  };
};

/**
                          |**************************************************|
                          |*******************  GET ALL *********************|
                          |**************************************************|
 */
// 1.1. admin:
const getAllInvoices = asyncErrorHandler(async (req, res, next) => {
  let where = {};
  const { results, metadata } = await readAllInvoices(req, res, next, where);

  return sendSuccess(res, 200, "Data retrieved", {
    results,
    metadata,
  });
});

// 1.2. others:
const getInvoicesOfUser = asyncErrorHandler(async (req, res, next) => {
  let where = { user_id: req.user_id };
  const { results, metadata } = await readAllInvoices(req, res, next, where);

  return sendSuccess(res, 200, "Data retrieved", {
    results,
    metadata,
  });
});

/**
                          |**************************************************|
                          |*******************  GET ONE *********************|
                          |**************************************************|
 */
// 2.
const getInvoiceById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const order = await Order.findByPk(id, {
      attributes: [
        "id",
        "user_id",
        "invoice_number",
        "total_amount",
        "amount_with_delivery",
        "status",
        "city",
        "shipping_address",
        "user_contact",
        "payment_type",
        "payment_status",
        "createdAt",
      ],
      include: [
        {
          model: User,
          attributes: ["name", "email"],
        },
        {
          model: Product,
          attributes: ["name", "thumbnail"],
          through: {
            attributes: ["quantity", "price_at_order"],
          },
        },
      ],
    });
    if (!order) {
      return res.status(404).json({
        success: false,
        error: "order bearing this invoice not found",
      });
    }

    if (order.user_id != req.user_id && req.user.role != "1")
      return makeError("unauthorized access", 403, next);
    res.status(200).json({ success: true, data: { results: order } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllInvoices,
  getInvoicesOfUser,
  getInvoiceById,
};

// const Product = require('../../models/Product');
// const Order = require('../../models/Order');
// const OrderProduct = require('../../models/OrderProduct');
// const Invoice = require('../../models/Invoice');
// const Delivery = require('../../models/Delivery');
// const User = require('../../models/User');

// // Async function to handle invoice retrieval
// exports.getInvoice = async (req, res) => {
//     try {
//         const { order_id } = req.params;

//         // Fetch detailed invoice information
//         const detailedInvoice = await Invoice.findOne({
//             where: { order_id },
//             include: [
//                 {
//                     model: Order,
//                     include: [
//                         {
//                             model: OrderProduct,
//                             include: [Product] // Include Product to get product details
//                         },
//                         User // Include User to get the user's name
//                     ]
//                 }
//             ]
//         });

//         if (!detailedInvoice) {
//             return res.status(404).json({ success: false, message: 'Invoice not found' });
//         }

//         // Extract order details
//         const orderDetails = detailedInvoice.Order;

//         // Fetch the delivery charges based on the city in the order
//         const delivery = await Delivery.findOne({
//             where: { city: orderDetails.city }
//         });

//         if (!delivery) {
//             return res.status(404).json({ success: false, message: 'Delivery charges for city not found' });
//         }

//         // Calculate total amount with delivery charges
//         const deliveryCity = delivery.city;
//         const deliveryCharges = delivery.charges;
//         const totalAmount = orderDetails.total_amount;
//         const amountWithDelivery = totalAmount + deliveryCharges;

//         // Extract product details from the order
//         const orderProducts = orderDetails.OrderProducts.map(orderProduct => ({
//             product_name: orderProduct.Product.name, // Assuming `name` is a field in Product model
//             quantity: orderProduct.quantity,
//             price_at_order: orderProduct.price_at_order
//         }));

//         // Prepare the response
//         const response = {
//             invoice_id: detailedInvoice.id,
//             order_id: detailedInvoice.order_id,
//             invoice_number: detailedInvoice.invoice_number,
//             user_name: orderDetails.User.name,
//             delivery_city: deliveryCity,
//             payment_status: detailedInvoice.payment_status,
//             created_at: detailedInvoice.created_at,
//             total_amount: totalAmount,
//             delivery_charges: deliveryCharges,
//             amount_with_delivery: amountWithDelivery,
//             shipping_address: orderDetails.shipping_address,
//             products: orderProducts,
//             //addded to show the transiction details.
//             transaction_id: orderDetails.transaction_id,
//             transaction_date: orderDetails.transaction_date,

//         };

//         res.status(200).json({ success: true, data: response });
//     } catch (error) {
//         res.status(500).json({ success: false, error: error.message });
//     }
// };

// // Async function to retrieve all invoices
// exports.getAllInvoices = async (req, res) => {
//     const { page = 1, limit = 10 } = req.query;  // Default values for pagination
//     const limitValue = parseInt(limit, 10);
//     const offset = (parseInt(page, 10) - 1) * limitValue;

//     try {
//         let invoices;

//         if (req.user.role === '1') {
//             // Fetch all invoices with their associated orders and other required data (with pagination)
//             invoices = await Invoice.findAndCountAll({
//                 include: [
//                     {
//                         model: Order,
//                         include: [
//                             {
//                                 model: OrderProduct,
//                                 include: [Product]  // Include Product to get product details
//                             },
//                             User  // Include User to get user details like name
//                         ]
//                     }
//                 ],
//                 limit: limitValue,  // Limit the number of invoices per page
//                 offset: offset      // Skip (page - 1) * limit records
//             });
//         } else if (req.body.user.role === '2') {
//             // Fetch all invoices for a specific user (with pagination)
//             invoices = await Invoice.findAndCountAll({
//                 where: { user_id: req.body.user.id },
//                 include: [
//                     {
//                         model: Order,
//                         include: [
//                             {
//                                 model: OrderProduct,
//                                 include: [Product]
//                             },
//                             User
//                         ]
//                     }
//                 ],
//                 limit: limitValue,
//                 offset: offset
//             });
//         }

//         if (!invoices || invoices.rows.length === 0) {
//             return res.status(404).json({ success: false, message: 'No invoices found' });
//         }

//         // Map through each invoice and construct the necessary data
//         const detailedInvoices = await Promise.all(invoices.rows.map(async (invoice) => {
//             const orderDetails = invoice.Order;

//             // Fetch the delivery charges based on the city in the order
//             const delivery = await Delivery.findOne({
//                 where: { city: orderDetails.city }
//             });

//             if (!delivery) {
//                 return res.status(404).json({ success: false, message: 'Delivery charges for city not found' });
//             }

//             const deliveryCharges = delivery.charges;
//             const totalAmount = orderDetails.total_amount;
//             const amountWithDelivery = totalAmount + deliveryCharges;

//             // Construct the response object for each invoice
//             return {
//                 invoice_id: invoice.id,
//                 order_id: invoice.order_id,
//                 invoice_number: invoice.invoice_number,
//                 created_at: invoice.created_at,
//                 return_date: orderDetails.return_payment_date,  // Assuming this exists in Order model
//                 amount: amountWithDelivery,
//                 payment_status: orderDetails.payment_status,
//                 payment_method: orderDetails.payment_type  // Assuming this exists in Order model
//             };
//         }));

//         // Pagination metadata
//         const totalInvoices = invoices.count;
//         const totalPages = Math.ceil(totalInvoices / limitValue);
//         const currentPage = parseInt(page, 10);

//         // Send the response with paginated invoices and pagination info
//         res.status(200).json({
//             success: true,
//             data: detailedInvoices,
//             pagination: {
//                 totalInvoices,
//                 totalPages,
//                 currentPage,
//                 limit: limitValue
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ success: false, error: error.message });
//     }
// };
