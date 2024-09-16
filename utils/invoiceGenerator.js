const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');

const generateInvoice = async (orderId) => {
    const order = await Order.findByPk(orderId, {
        include: [{ model: User }, { model: Product }]
    });    

    const doc = new PDFDocument();
    const invoicePath = path.join(__dirname, '../uploads/invoices', `invoice-${orderId}.pdf`);
    doc.pipe(fs.createWriteStream(invoicePath)); //clear till thiis point. 

    doc.fontSize(25).text(`Invoice #${orderId}`, 100, 80);
    doc.fontSize(16).text(`Name: ${order.User.name}`, 100, 130);
    doc.fontSize(16).text(`Date: ${new Date().toLocaleDateString()}`, 100, 130);

    doc.fontSize(12).text(`Shipping Address: ${order.shipping_address}`, 100, 160);

    // List products
    order.Products.forEach((product, index) => {
        const item = order.OrderProduct[index];
        doc.text(`${product.name} - Quantity: ${item.quantity} - Price: $${item.price_at_order}`, 100, 200 + index * 20);
    });

    doc.text(`Total Amount: $${order.total_amount}`, 100, 260);

    doc.end();

    return invoicePath;
};

module.exports = { generateInvoice };
