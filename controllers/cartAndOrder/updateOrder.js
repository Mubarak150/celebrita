class UpdateOrder {
  constructor(io) {
    this.io = io;
  }

  async updateOrderStatus(req, res) {
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

      if (!order) {
        return res
          .status(404)
          .json({ success: false, error: "Order not found" });
      }

      let notificationMessage = "";

      switch (status) {
        case "approve":
          notificationMessage = await this.approveOrder(
            order,
            exp_delivery_date
          );
          break;

        case "reject":
          notificationMessage = await this.rejectOrder(order, rejection_reason);
          break;

        case "on-the-way":
          notificationMessage = await this.dispatchOrder(
            order,
            courier_company,
            tracking_id
          );
          break;

        case "receive":
          notificationMessage = await this.receiveOrder(order);
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
          notificationMessage = await this.receiveReturn(order);
          break;

        case "return-payment":
          notificationMessage = await this.processReturnPayment(req, order);
          break;

        case "completed":
          order.status = "completed";
          notificationMessage = `Order #${order.id} has been completed.`;
          break;

        default:
          return res.status(404).json({
            success: false,
            message: `Order with status ${status} not found`,
          });
      }

      await order.save();

      this.sendNotificationToUser(order.user_id, order.id, notificationMessage);

      return res.status(200).json({
        success: true,
        data: order,
        notification: { message: notificationMessage, user: order.user_id },
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  async approveOrder(order, exp_delivery_date) {
    if (order.status === "approved") {
      throw new Error("Order already approved");
    }
    order.status = "approved";
    order.exp_delivery_date = exp_delivery_date || null;
    return `Your order #${
      order.id
    } has been approved and you may expect its delivery on/before ${new Date(
      order.exp_delivery_date
    ).toDateString()}.`;
  }

  async rejectOrder(order, rejection_reason) {
    if (order.status === "rejected") {
      throw new Error("Order already rejected");
    }
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

  async dispatchOrder(order, courier_company, tracking_id) {
    if (order.status === "on-the-way") {
      throw new Error("Order already in transit");
    }
    order.status = "on-the-way";
    order.courier_company = courier_company;
    order.tracking_id = tracking_id;
    return `Your order #${order.id} has been dispatched successfully via ${order.courier_company} with the tracking ID: ${order.tracking_id}.`;
  }

  async receiveOrder(order) {
    if (order.status === "received") {
      throw new Error("Order already received");
    }
    const currentTime = new Date();
    order.status = "received";
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
    }, 4 * 24 * 60 * 60 * 1000);

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

  async receiveReturn(order) {
    if (order.status === "return-received") {
      throw new Error("Order already received from return");
    }
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

  async processReturnPayment(req, order) {
    if (order.status !== "return-received") {
      throw new Error("This order has not been received yet.");
    }
    if (order.payment_status === "returned") {
      throw new Error("The payment for this order has already been returned.");
    }

    const return_payment_proof = req.files?.["return_payment_proof"]?.[0]?.path;
    if (!return_payment_proof) {
      throw new Error("Providing proof image is mandatory.");
    }

    order.payment_status = "returned";
    order.return_payment_proof = return_payment_proof;
    order.return_payment_date = new Date();
    order.status = "completed";

    return `Your payment has been returned against return of order #${order.id}.`;
  }

  sendNotificationToUser(user_id, order_id, message) {
    // Placeholder for actual notification logic
    this.io
      .to(`user_${user_id}`)
      .emit("notification", { user_id, order_id, message });
  }
}

module.exports = UpdateOrder;
