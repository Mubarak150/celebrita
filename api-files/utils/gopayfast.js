const axios = require('axios');
const crypto = require('crypto');

// Function to generate a signature for the payment request
const generateSignature = (merchantId, securedKey, amount, orderId) => {
    const hashString = `${merchantId}${securedKey}${amount}${orderId}`;
    return crypto.createHash('md5').update(hashString).digest('hex');
};

// Function to get authentication token from PayFast
const getAuthToken = async (merchantId, securedKey) => {
    try {
        const tokenUrl = `https://ipguat.apps.net.pk/Ecommerce/api/Transaction/GetAccessToken?MERCHANT_ID=${merchantId}&SECURED_KEY=${securedKey}`;
        const response = await axios.get(tokenUrl);

        if (response.data && response.data.ACCESS_TOKEN) {
            return response.data.ACCESS_TOKEN;
        } else {
            throw new Error('Failed to retrieve access token');
        }
    } catch (error) {
        console.error('Error getting access token:', error.message);
        throw error;
    }
};

// Function to initiate payment
exports.initiatePayment = async (orderId, amount, userContact) => {
    console.log("you are in initiate payment")
    try {
        // Load configuration from environment variables
        const merchantId = process.env.PAYFAST_MERCHANT_ID;
        // const merchantKey = process.env.PAYFAST_MERCHANT_KEY;
        const securedKey = process.env.PAYFAST_SECURED_KEY; // Ensure this is in your .env
        const merchantName = process.env.PAYFAST_MERCHANT_NAME;
        const returnUrl = process.env.PAYFAST_RETURN_URL;
        const cancelUrl = process.env.PAYFAST_CANCEL_URL;
        const notifyUrl = process.env.PAYFAST_NOTIFY_URL;
        console.log("you are in initiate payment try instance")

        // Step 1: Get the token from PayFast
        const authToken = await getAuthToken(merchantId, securedKey);
        console.log("you are in initiate payment token: ", authToken)

        // Step 2: Prepare the payload for the payment request
        const payload = {
            MERCHANT_ID: merchantId, // y
            MERCHANT_NAME: merchantName,  // y
            TOKEN: authToken, // Include the obtained token  // y
            PROCCODE: "00",
            APP_PLUGIN: "WHMCS",
            TXNAMT: amount,
            CUSTOMER_MOBILE_NO: userContact || '920000000000', // Use a default if not provided
            CUSTOMER_EMAIL_ADDRESS: "email add here later",
            SIGNATURE: generateSignature(merchantId, securedKey, amount, orderId),
            VERSION: 'WHMCS1.0', // this is not in current syntax i think  <input type="hidden" name="VERSION" value="WHMCS1.0-' . $whmcsVersion . '">
            TXNDESC: "description",
            CURRENCY_CODE: "PKR",
            SUCCESS_URL: returnUrl,
            FAILURE_URL: cancelUrl,
            BASKET_ID: orderId,
            ORDER_DATE: "2024-09-26 12:04:45",
            CHECKOUT_URL: notifyUrl,
            submit: "Pay Now"
            
        };
// these are from php code.... kept here for cross checking # temporary
// <input type="hidden" name="MERCHANT_ID" value="' . $merchantId . '">
// <input type="hidden" name="MERCHANT_NAME" value="' . $params['merchant_name'] . '">
// <input type="hidden" name="TOKEN" value="' . $token . '">
// <input type="hidden" name="PROCCODE" value="00" >
// <input type="hidden" name="APP_PLUGIN" value="WHMCS" >
// <input type="hidden" name="TXNAMT" value="' . $params['amount'] . '">
// <input type="hidden" name="CUSTOMER_MOBILE_NO" value="' . $phonenumber . '">
// <input type="hidden" name="CUSTOMER_EMAIL_ADDRESS" value="' . $params['clientdetails']['email'] . '">
// <input type="hidden" name="SIGNATURE" value="' . $signature . '">
// <input type="hidden" name="VERSION" value="WHMCS1.0-' . $whmcsVersion . '">
// <input type="hidden" name="TXNDESC" value="' . $params['description'] . '">
// <input type="hidden" name="CURRENCY_CODE" value="PKR">
// <input type="hidden" name="SUCCESS_URL" value="' . $callback . '">
// <input type="hidden" name="FAILURE_URL" value="' . $callback . '">
// <input type="hidden" name="BASKET_ID" value="' . $params['invoiceid'] . '">            
// <input type="hidden" name="ORDER_DATE" value="' . date('Y-m-d H:i:s', time()) . '">
// <input type="hidden" name="CHECKOUT_URL" value="' . $callback . '">
// <input type="submit" name="submit" value="Pay Now"></input>
       
        console.log("you are in initiate payment/payload: ", payload) // it is not printing this line. why? 

        // Step 3: Initiate the payment request using the token
        const paymentUrl = 'https://ipguat.apps.net.pk/Ecommerce/api/Transaction/PostTransaction';
        const response = await axios.post(paymentUrl, payload);
        // console.log("you are in initiate payment/ step 3 :", response) // the request ended with 204 i.e. no content.

        // Log the full response for debugging
        // console.log('you are in initiate payment/ step 3, this is PayFast API Full Response:', response.data);
        // Check the response for the payment URL
        // if (response.data && response.data.payment_url) {
            return response.data
        // } else {
        //     console.error('PayFast API Error:', response.data);
        //     throw new Error(response.data.message || 'Failed to initiate payment.'); // i am currently getting this error. 
        // }
    } catch (error) {
        console.error('Detailed PayFast Error:', error.message);
        if (error.response) {
            console.log('PayFast API Full Error Response:', error.response.data);
        }
        throw new Error(`PayFast Error: ${error.message}`);
    }
};

// Function to handle callback from PayFast (to be used in your routes)
exports.handleCallback = (req, res) => {
    // Handle the response from PayFast
    const { paymentStatus, transactionId } = req.query;

    // Implement your logic here for success/failure
    if (paymentStatus === 'success') {
        // Payment was successful
        res.status(200).send(`Payment Successful: Transaction ID ${transactionId}`);
    } else {
        // Payment failed
        res.status(400).send('Payment Failed');
    }
};


