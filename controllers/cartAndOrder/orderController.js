const User = require("../../models/User");
const Product = require("../../models/Product");
const Order = require("../../models/Order");
const OrderProduct = require("../../models/OrderProduct");
const Invoice = require("../../models/Invoice");
const Notification = require("../../models/Notification");
const { sendNotificationToUser } = require("../../utils/socket"); // importiiiiiiiiiing Socket.IO instance
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const { getAll, sendSuccess } = require("../../utils/helpers");
const { sequelize } = require("../../config/db");
const { Op } = require("sequelize");
const ApiFeatures = require("../../utils/ApiFeatures");
const UpdateOrder = require("./updateOrder");
const { updateOrderSchema } = require("../../utils/validators");

/**
                          |**************************************************|
                          |**************** UTILITY FUNC.  ******************|
                          |**************************************************|
 */
const readAllOrders = async (req, res, next, where = {}) => {
  const features = new ApiFeatures(Order, {}, req.query).filter();
  features.queryOptions.where = { ...features.queryOptions.where, ...where };
  features.queryOptions.include = [
    {
      model: Invoice,
      attributes: ["order_id", "invoice_number"],
    },
    {
      model: User,
      attributes: ["id", "name", "email"],
    },
    {
      model: Product,
      attributes: ["id", "name", "thumbnail"],
      through: {
        attributes: ["quantity", "price_at_order"],
      },
    },
  ];

  features.sort().limit_fields();
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
// 1.
const getOrders = asyncErrorHandler(async (req, res, next) => {
  let where = {};
  const { results, metadata } = await readAllOrders(req, res, next, where);

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
const getOrderById = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await Order.findByPk(id, {
      include: [{ model: User }, { model: Product }],
    });
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
                          |**************************************************|
                          |***************  UPDATE STATUS  ******************|
                          |**************************************************|
 */

// 3.1 // Middleware to dynamically select schema
const dynamicSchemaMiddleware = (req, res, next) => {
  const { status } = req.params;

  if (!status || !updateOrderSchema[status]) {
    return res.status(400).json({
      success: false,
      message: `Invalid or unsupported status: ${status}`,
    });
  }

  // Attach the schema for the `validate` middleware
  req.selectedSchema = updateOrderSchema[status];
  next();
};

//3. 2
const updateOrder = async (req, res, next) => {
  const order = new UpdateOrder();
  await order.updateOrderStatus(req, res, next);
};

module.exports = {
  getOrders,
  updateOrder,
  getOrderById,

  // utility function:
  readAllOrders,

  // middleware
  dynamicSchemaMiddleware,
};

// const io = req.app.get("io");
// const { id, status } = req.params;
// const {
//   rejection_reason,
//   exp_delivery_date,
//   courier_company,
//   tracking_id,
//   return_rejection_reason,
//   return_address,
// } = req.body;

// try {
//   const order = await Order.findByPk(id);

//   if (!order) {
//     return res.status(404).json({ success: false, error: "Order not found" });
//   }

//   let notificationMessage = "";

//   switch (status) {
//     case "approve":
//       if (order.status == "approved") {
//         return res
//           .status(400)
//           .json({ status: false, message: "Order already approved" });
//       } else {
//         order.status = "approved";
//         order.exp_delivery_date = exp_delivery_date || null;
//         notificationMessage = `Your order #${
//           order.id
//         } has been approved and you may expect its delivery on/before ${new Date(
//           order.exp_delivery_date
//         ).toDateString()}.`;
//       }
//       break;

//     case "reject":
//       if (order.status == "rejected") {
//         return res
//           .status(400)
//           .json({ status: false, message: "Order already rejected" });
//       } else {
//         order.status = "rejected";
//         order.rejection_reason = rejection_reason;
//         notificationMessage = `Your order #${order.id} has been rejected. The rejection reason provided by our team is: ${order.rejection_reason}.`;

//         // Fetch all the OrderProducts associated with this order
//         const orderProducts = await OrderProduct.findAll({
//           where: { order_id: order.id },
//         });

//         // Update product quantities
//         for (const orderProduct of orderProducts) {
//           const product = await Product.findOne({
//             where: { id: orderProduct.product_id },
//           });
//           if (product) {
//             product.quantity += orderProduct.quantity;
//             await product.save();
//           }
//         }
//       }
//       break;

//     case "on-the-way":
//       if (order.status == "on-the-way") {
//         return res
//           .status(400)
//           .json({ status: false, message: "Order already in transit" });
//       } else {
//         order.status = "on-the-way";
//         order.courier_company = courier_company;
//         order.tracking_id = tracking_id;
//         notificationMessage = `Your order #${order.id} has been dispatched successfully via ${order.courier_company} with the tracking ID: ${order.tracking_id}.`;
//       }
//       break;

//     case "receive": {
//       if (order.status == "received") {
//         return res
//           .status(400)
//           .json({ status: false, message: "Order already received" });
//       } else {
//         const currentTime = new Date();
//         order.status = "received";
//         order.reciept_date = currentTime;
//         const returnExpiryDate = new Date(currentTime);
//         returnExpiryDate.setDate(returnExpiryDate.getDate() + 4);
//         order.return_expiry_date = returnExpiryDate;
//         notificationMessage = `Your order #${order.id} has reached successfully. Thank you for shopping at Celebrita.`;

//         // Automatically mark as completed if not changed within 4 days
//         setTimeout(async () => {
//           const updatedOrder = await Order.findByPk(order.id);
//           if (updatedOrder && updatedOrder.status === "received") {
//             updatedOrder.status = "completed";
//             await updatedOrder.save();
//           }
//         }, 4 * 24 * 60 * 60 * 1000); // 4 days
//       }
//       break;
//     }

//     case "return-reject":
//       order.status = "completed";
//       order.return_rejection_reason =
//         return_rejection_reason || "Return rejected by admin";
//       notificationMessage = `Your request to return order #${order.id} has been rejected because: ${order.rejection_reason}.`;
//       break;

//     case "return-approve":
//       order.status = "return-approved";
//       order.return_address = return_address;
//       notificationMessage = `Your request to return order #${order.id} has been approved. You may return the order to ${order.return_address}.`;
//       break;

//     // the user will after wards change the status from return approved to return on the way.

//     case "return-receive":
//       if (order.status == "return-received") {
//         return res.status(400).json({
//           status: false,
//           message: "Order already received from return",
//         });
//       } else {
//         order.status = "return-received";
//         notificationMessage = `Your return of order #${order.id} reached our warehouse.`;

//         const orderProducts = await OrderProduct.findAll({
//           where: { order_id: order.id },
//         });
//         for (const orderProduct of orderProducts) {
//           const product = await Product.findByPk(orderProduct.product_id);
//           if (product) {
//             product.returned_quantity += orderProduct.quantity;
//             await product.save();
//           }
//         }
//       }
//       break;

//     // return-user-paid route i.e. changing only payment status only... not order status which wiwl remain as return=recieved .:.:.:.:.:.:.:.:.:. check first to see if the order is in the status of return-recieved if yes then update its order.payment-status to returned
//     case "return-payment":
//       if (order.status !== "return-received") {
//         return res.status(400).json({
//           status: false,
//           message: "this order has not been recieved yet.",
//         });
//       } else if (
//         order.status === "return-received" &&
//         order.payment_status === "returned"
//       ) {
//         return res.status(400).json({
//           status: false,
//           message: "The payment for this order has already been returned.",
//         });
//       } else {
//         const return_payment_proof =
//           req.files && req.files["return_payment_proof"]
//             ? req.files["return_payment_proof"][0].path
//             : null;

//         if (!return_payment_proof) {
//           return res.status(400).json({
//             status: false,
//             message: "providing proof image is mandatory.",
//           });
//         }

//         if (req.files) {
//           const image = `/uploads/products/${req.files.return_payment_proof[0].filename}`;
//           req.body.return_payment_proof = image;
//         }
//         order.payment_status = "returned";
//         order.return_payment_proof = req.body.return_payment_proof;
//         order.return_payment_date = Date.now();
//         order.status = "completed";

//         notificationMessage = `Your payment has been returned against return of order #${order.id}.`;
//       }
//       break;

//     case "completed":
//       order.status = "completed";
//       break;

//     default:
//       return res.status(404).json({
//         success: false,
//         message: `order with status ${status} not found`,
//       });
//   }

//   await order.save();

//   // Create and emit the notification
//   // const notification = await Notification.create({
//   //   user_id: order.user_id,
//   //   order_id: order.id,
//   //   message: notificationMessage,
//   // });

//   // io.to(`user_${order.user_id}`).emit('notification', notification);
//   sendNotificationToUser(order.user_id, order.id, notificationMessage);

//   return res.status(200).json({
//     success: true,
//     data: order,
//     notification: { message: notificationMessage, user: order.user_id },
//   });
// } catch (error) {
//   return res.status(500).json({ success: false, error: error.message });
// }
