const User = require("../../models/User");
const Product = require("../../models/Product");
const Order = require("../../models/Order");
const OrderProduct = require("../../models/OrderProduct");
const Invoice = require("../../models/Invoice");
const Notification = require("../../models/Notification");
const { sendNotificationToUser } = require("../../utils/socket"); // importiiiiiiiiiing Socket.IO instance
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const { makeError } = require("../../utils/CustomError");
const { getAll, sendSuccess } = require("../../utils/helpers");

class UpdateOrder {
  async updateOrderStatus(req, res, next) {
    const { id, status } = req.params;
    const {
      rejection_reason,
      exp_delivery_date,
      courier_company,
      tracking_id,
      return_rejection_reason,
      return_address,
    } = req.body;

    try {
      const order = await Order.findByPk(id);

      if (!order) return makeError("Order not found", 404, next);

      let notificationMessage = "";

      switch (status) {
        case "approve":
          notificationMessage = await this.approveOrder(
            order,
            exp_delivery_date,
            next
          );
          break;

        case "reject":
          notificationMessage = await this.rejectOrder(
            order,
            rejection_reason,
            next
          );
          break;

        case "on-the-way":
          notificationMessage = await this.dispatchOrder(
            order,
            courier_company,
            tracking_id,
            next
          );
          break;

        case "received":
          notificationMessage = await this.receiveOrder(order, next);
          break;

        case "return-reject":
          notificationMessage = this.rejectReturn(
            order,
            return_rejection_reason
          );
          break;

        case "return-approve":
          notificationMessage = this.approveReturn(order, return_address);
          break;

        case "return-receive":
          notificationMessage = await this.receiveReturn(order, next);
          break;

        case "return-payment":
          notificationMessage = await this.processReturnPayment(
            req,
            order,
            next
          );
          break;

        case "completed":
          order.status = "completed";
          notificationMessage = `Order #${order.id} has been completed.`;
          break;

        default:
          return res.status(404).json({
            success: false,
            message: `#IVD: Order with status ${status} not found`,
          });
      }

      await order.save();
      if (notificationMessage != "" && notificationMessage != null) {
        await sendNotificationToUser(
          order.user_id,
          order.id,
          notificationMessage
        );

        return sendSuccess(res, 200, "process successful", order, "results");
      }
    } catch (error) {
      return next(error);
    }
  }

  // 1.
  async approveOrder(order, exp_delivery_date, next) {
    if (order.status === "approved")
      return makeError("order already approved", 400, next);

    order.status = "approved";
    order.exp_delivery_date = exp_delivery_date || null;
    return `Your order #${
      order.id
    } has been approved and you may expect its delivery on/before ${new Date(
      order.exp_delivery_date
    ).toDateString()}.`;
  }

  // 2.
  async rejectOrder(order, rejection_reason, next) {
    if (order.status === "rejected")
      return makeError("order already rejected", 400, next);

    order.status = "rejected";
    order.rejection_reason = rejection_reason;

    const orderProducts = await OrderProduct.findAll({
      where: { order_id: order.id },
    });
    for (const orderProduct of orderProducts) {
      const product = await Product.findOne({
        where: { id: orderProduct.product_id },
      });
      if (product) {
        product.quantity += orderProduct.quantity;
        await product.save();
      }
    }

    return `Your order #${order.id} has been rejected. The rejection reason provided by our team is: ${order.rejection_reason}.`;
  }

  async dispatchOrder(order, courier_company, tracking_id, next) {
    if (order.status === "on-the-way")
      return makeError("order already in transit", 400, next);

    order.status = "on-the-way";
    order.courier_company = courier_company;
    order.tracking_id = tracking_id;
    return `Your order #${order.id} has been dispatched successfully via ${order.courier_company} with the tracking ID: ${order.tracking_id}.`;
  }

  // done.
  async receiveOrder(order, next) {
    if (order.status === "received")
      return makeError("order already recieved", 400, next);
    const currentTime = new Date();
    order.status = "received";
    order.payment_status = "completed";
    order.reciept_date = currentTime;
    const returnExpiryDate = new Date(currentTime);
    returnExpiryDate.setDate(returnExpiryDate.getDate() + 4);
    order.return_expiry_date = returnExpiryDate;

    setTimeout(async () => {
      const updatedOrder = await Order.findByPk(order.id);
      if (updatedOrder && updatedOrder.status === "received") {
        updatedOrder.status = "completed";
        await updatedOrder.save();
      }
    }, 4 * 24 * 60 * 30 * 1000); // conditionally execute after 4 days. working like a chronjob.

    return `Your order #${order.id} has reached successfully. Thank you for shopping at Celebrita.`;
  }

  rejectReturn(order, return_rejection_reason) {
    order.status = "completed";
    order.return_rejection_reason =
      return_rejection_reason || "Return rejected by admin";
    return `Your request to return order #${order.id} has been rejected because: ${order.return_rejection_reason}.`;
  }

  approveReturn(order, return_address) {
    order.status = "return-approved";
    order.return_address = return_address;
    return `Your request to return order #${order.id} has been approved. You may return the order to ${order.return_address}.`;
  }

  async receiveReturn(order, next) {
    if (order.status === "return-received")
      return makeError("order already recieved from return", 400, next);
    order.status = "return-received";

    const orderProducts = await OrderProduct.findAll({
      where: { order_id: order.id },
    });
    for (const orderProduct of orderProducts) {
      const product = await Product.findByPk(orderProduct.product_id);
      if (product) {
        product.returned_quantity += orderProduct.quantity;
        await product.save();
      }
    }

    return `Your return of order #${order.id} reached our warehouse.`;
  }

  async processReturnPayment(req, order, next) {
    if (order.status !== "return-received")
      return makeError("this order has not been recieved yet", 400, next);
    if (order.payment_status === "returned")
      return makeError(
        "payment for this order has already been returned",
        400,
        next
      );

    const return_payment_proof =
      req.files && req.files["return_payment_proof"]
        ? req.files["return_payment_proof"][0].path
        : null;
    if (!return_payment_proof)
      return makeError(
        "providing proof of payment back to user is mandatory",
        400,
        next
      );

    order.payment_status = "returned";
    order.return_payment_proof = return_payment_proof;
    order.return_payment_date = new Date();
    order.status = "completed";

    return `Your payment has been returned against return of order #${order.id}.`;
  }

  //   sendNotificationToUser(user_id, order_id, message) {
  //     // Placeholder for actual notification logic
  //     this.io
  //       .to(`user_${user_id}`)
  //       .emit("notification", { user_id, order_id, message });
  //   }
}

module.exports = UpdateOrder;
