const express = require('express');
const Product = require('../../models/Product');
const Shift = require('../../models/Shift');
const ShiftSale = require('../../models/ShiftSale');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Controller function for starting a shift
const startShift = async (req, res) => {
    const { user_id } = req.body;  // Salesperson ID retrieved from token by the PROTECT middleware. 

    try {
        // Step 1: Create a new shift for the user, with shift_end as null
        const shift = await Shift.create({
            user_id,
            shift_start: new Date(),
            shift_end: null,
            sale_in_shift: 0  // Initial sale value
        });

        // Step 2: Get all active product details including id, quantity, price, and discount
        const products = await Product.findAll({
            where: { status: 'active' },  // Only retrieve active products
            attributes: ['id', 'name', 'quantity', 'price', 'discount']  // Fetch these specific columns
        });

        // Step 3: Send response back with the shift data and active product details
        res.status(200).json({
            success: true,
            message: 'Shift started successfully',
            shift: shift,
            products: products
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error starting shift',
            error: error.message
        });
    }
};



// Controller function for ending a shift
const endShift = async (req, res) => {
    const { shift_id, salesData } = req.body; // Shift ID, and the two arrays for products and sales data
    const { user_id } = req.body; // Get user_id from request body

    try {
        // Step 1: Retrieve the shift to check the user_id
        const shift = await Shift.findByPk(shift_id);

        // Check if the shift exists and if the user_id matches
        if (!shift) {
            return res.status(404).json({
                success: false,
                message: 'Shift not found'
            });
        }

        if (shift.user_id !== user_id) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized: You cannot end this shift'
            });
        }

        if (shift.status == 'closed') {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized: Cannor end a shift twice'
            });
        }

        // Step 2: End the shift by updating the shift_end column
        await Shift.update(
            { shift_end: new Date(), status: 'closed' }, 
            { where: { id: shift_id } }
        );

        // Step 3: Update product quantities
        for (let sale of salesData) {
            const { id, quantity } = sale;

            // Fetch the current product from the database
            const product = await Product.findByPk(id);

            // Update the product's quantity
            if (product) {
                await product.update({
                    quantity: product.quantity - quantity // Decrease the product quantity
                });
            }
        }

        // Step 4: Insert sales records into ShiftSales table
        let totalShiftSale = 0; // To calculate the total sales amount in the shift

        for (let sale of salesData) {
            const { id, quantity } = sale;

            // Fetch product details to calculate the price after discount
            const product = await Product.findByPk(id);
            if (product) {
                const priceAtSale = product.price * (1 - product.discount / 100);
                const totalSale = priceAtSale * quantity;

                // Insert a record in ShiftSales for each sale
                await ShiftSale.create({
                    shift_id: shift_id,
                    product_id: id,
                    price_at_sale: priceAtSale,
                    sold_quantity: quantity
                });

                totalShiftSale += totalSale; // Add to the total shift sale
            }
        }

        // Step 5: Update the total sales amount in the shift
        await Shift.update(
            { sale_in_shift: totalShiftSale }, 
            { where: { id: shift_id } }
        );

        // Step 6: Clear the JWT token by setting an empty header (logging out the user)
        res.setHeader('Authorization', ''); // Clearing JWT token from the header

        res.status(200).json({
            success: true,
            message: 'Shift ended successfully, user logged out',
            totalShiftSale
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error ending shift',
            error: error.message
        });
    }
};



module.exports = {
    startShift,
    endShift
};