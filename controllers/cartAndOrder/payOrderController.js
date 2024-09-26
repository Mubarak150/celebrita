const { initiatePayment, handleCallback } = require('../../utils/gopayfast'); // Import the necessary functions from gopayfast
const Order = require('../../models/Order');

exports.initiatePayFastPayment = async (req, res) => {
    try {
        const { id } = req.body; // order_id sent from the React frontend
        const order = await Order.findByPk(id); // Find order by primary key
        // res.send(order)

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Call the initiatePayment function with required parameters
        const paymentUrl = await initiatePayment(order.id, order.amount_with_delivery, order.user_contact); // the code runs upto this line. 
        console.log("payment called")

        return res.status(200).json({ success: true, payment_url: paymentUrl });

    } catch (error) {
        console.error('Error initiating PayFast payment:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to initiate PayFast payment' });
    }
};

// Callback route to handle the response from PayFast
exports.handlePayFastCallback = (req, res) => {
    handleCallback(req, res); // Delegate handling of the callback to the utility function
};
