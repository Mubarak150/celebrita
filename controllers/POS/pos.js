const express = require('express');
const Product = require('../../models/Product');
const User = require('../../models/User');
const Shift = require('../../models/Shift');
const ShiftSale = require('../../models/ShiftSale');
const {Op} = require('sequelize')
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
            attributes: ['id', 'name', 'quantity', 'price', 'discount', 'barcode']  // Fetch these specific columns
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

// const getProducts = async (req, res) => {
//     try {

//     } catch (error) {}
// }

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
        if(salesData.length == 0) {
            return res.status(200).json({
                success: true,
                message: "Shift Ended, with no sales..."
            })
        } else {
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

const getProductByBarcode = async (req, res) => {
    try {
        const { barcode } = req.body;  // The search term from the request (e.g., 'panadol')

        // Step 1: Query the database to find products where the name matches or contains the search term
        const product = await Product.findOne({
            where: {
                barcode
            },
            attributes: ['name']  // Only select the 'name' field
        });

        // Step 2: Check if any products were found
        if (!product) {
            return res.status(404).json({ success: false, message: 'No matching product found' });
        }

        // Step 3: Extract only the product names into an array
        const productName = product.name; 

        // Step 4: Send the product names as an array
        res.status(200).json({ success: true, data: productName });
    } catch (error) {
        // Handle any errors
        res.status(500).json({ success: false, error: error.message });
    }
};


// admin controllers: 

// Controller function for getting all shifts of a salesperson on a particular date // done
const getShiftsByVendorAndDate = async (req, res) => {
    const { user_id } = req.params;  // Vendor ID from URL params
    const { date } = req.params;      // Date from query params (format: YYYY-MM-DD)

    try {
        // Step 1: Find all shifts by the given Vendor on the specified date
        const shifts = await Shift.findAll({
            where: {
                user_id,  // Match the Vendor (user_id)
                shift_start: {
                    [Op.gte]: new Date(`${date}T00:00:00`), // Start of the day
                    [Op.lte]: new Date(`${date}T23:59:59`)  // End of the day
                }
            }
        });

        // Step 2: Check if any shifts are found
        if (shifts.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No shifts found for vendor ${user_id} on ${date}`
            });
        }

        // Step 3: Return the found shifts
        res.status(200).json({
            success: true,
            message: `Shifts for vendor ${user_id} on ${date}`,
            shifts
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving shifts',
            error: error.message
        });
    }
};


// Controller function for getting sales by a particular date (admin inquiry)
const getProductsSoldByDate = async (req, res) => {
    const { date } = req.query; // Expect date in YYYY-MM-DD format

    try {
        // Step 1: Find all shifts that started or ended on the specified date
        const shifts = await Shift.findAll({
            where: {
                shift_start: {
                    [Op.gte]: new Date(`${date}T00:00:00`), // start of the day
                    [Op.lte]: new Date(`${date}T23:59:59`)  // end of the day
                }
            }
        });

        if (shifts.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No shifts found for the given date'
            });
        }

        // Step 2: Collect all sales for the found shifts
        const shiftIds = shifts.map(shift => shift.id);
        const sales = await ShiftSale.findAll({
            where: {
                shift_id: shiftIds
            },
            include: [{
                model: Product,
                attributes: ['id', 'name'] // Include product id and name
            }]
        });

        // Step 3: Aggregate sales by product
        const productSalesMap = {};

        sales.forEach(sale => {
            const productId = sale.Product.id;
            const productName = sale.Product.name;
            const quantitySold = sale.sold_quantity;
            const priceAtSale = sale.price_at_sale;
            const totalAmountFromProduct = priceAtSale * quantitySold; // Calculate total amount for this sale

            // If the product is already in the map, accumulate the quantity and total amount
            if (productSalesMap[productId]) {
                productSalesMap[productId].quantity_sold_in_the_day += quantitySold;
                productSalesMap[productId].total_amount_from_product += totalAmountFromProduct;
            } else {
                // Otherwise, add a new entry for the product
                productSalesMap[productId] = {
                    product_name: productName,
                    price_at_sale: priceAtSale, // Include price at sale
                    quantity_sold_in_the_day: quantitySold,
                    total_amount_from_product: totalAmountFromProduct
                };
            }
        });

        // Convert the map to an array
        const consolidatedSales = Object.values(productSalesMap);

        // Step 4: Return the consolidated sales data
        res.status(200).json({
            success: true,
            message: `Sales data for ${date}`,
            sales: consolidatedSales
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving sales data by date',
            error: error.message
        });
    }
};

// Controller function for getting sales by a particular shift (admin inquiry)
const getSalesByShift = async (req, res) => {
    const { shift_id } = req.params;

    try {
        // Step 1: Find the shift by its ID
        const shift = await Shift.findByPk(shift_id);

        if (!shift) {
            return res.status(404).json({
                success: false,
                message: 'Shift not found'
            });
        }

        // Step 2: Find all sales made during this shift
        const sales = await ShiftSale.findAll({
            where: { shift_id },
            include: [Product] // Include product details
        });

        res.status(200).json({
            success: true,
            message: `Sales data for shift ${shift_id}`,
            sales: sales
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving sales data by shift',
            error: error.message
        });
    }
};

// Controller function for getting sales by a particular Vendor in a month (admin inquiry)
const getSalesByVendor = async (req, res) => {
    const { user_id, month } = req.params; // User ID of the Vendor and month (format: MM)

    try {
        // Step 1: Validate the user (Vendor)
        const user = await User.findByPk(user_id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }

        // Step 2: Find all shifts by the Vendor in the given month
        const shifts = await Shift.findAll({
            where: {
                user_id,
                shift_start: {
                    [Op.gte]: new Date(`2024-${month}-01T00:00:00`),  // start of the month
                    [Op.lt]: new Date(`2024-${month + 1}-01T00:00:00`) // end of the month
                }
            }
        });

        if (shifts.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No shifts found for user ${user_id} in month ${month}`
            });
        }

        // Step 3: Collect all sales for the found shifts
        const shiftIds = shifts.map(shift => shift.id);
        const sales = await ShiftSale.findAll({
            where: {
                shift_id: shiftIds
            },
            include: [Product] // Include product details
        });

        res.status(200).json({
            success: true,
            message: `Sales data for user ${user_id} in month ${month}`,
            sales: sales
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving sales data by Vendor',
            error: error.message
        });
    }
};

const getShiftsInADay = async (req, res) => {
    const { date } = req.query; // Date from query (format: YYYY-MM-DD)

    try {
        // Step 1: Find all shifts by the given Vendor on the specified date
        const shifts = await Shift.findAll({
            where: {
                shift_start: {
                    [Op.gte]: new Date(`${date}T00:00:00`), // Start of the day
                    [Op.lte]: new Date(`${date}T23:59:59`)  // End of the day
                }
            },
            attributes: ['id', 'user_id', 'shift_start', 'shift_end', 'sale_in_shift', 'status'],
            include: [{
                model: User,
                attributes: ['name'] // Only include the name
            }] 
        });

        // Step 2: Check if any shifts are found
        if (shifts.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No shifts found on ${date}`
            });
        }

        // Step 3: Format the shifts to include only time for shift_start and shift_end
        const formattedShifts = shifts.map(shift => ({
            ...shift.toJSON(), // Convert shift to plain object
            shift_start: shift.shift_start.toISOString().split('T')[1].split('.')[0], // Extract time
            shift_end: shift.shift_end.toISOString().split('T')[1].split('.')[0] // Extract time
        }));

        // Step 4: Return the formatted shifts
        res.status(200).json({
            success: true,
            message: `Shifts on ${date}`,
            shifts: formattedShifts
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving shifts',
            error: error.message
        });
    }
};




module.exports = {
    startShift,
    endShift,
    getProductByBarcode,
    // getProducts,
    getShiftsByVendorAndDate,
    getProductsSoldByDate,
    getShiftsInADay,
    getSalesByShift,
    getSalesByVendor
};