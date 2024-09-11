const { Op } = require('sequelize'); // Sequelize operators
const { sanitize } = require('express-validator');
const {sequelize} = require('../config/db'); 
const { QueryTypes } = require('sequelize');

// Create a new record with raw SQL query
const handleCreate = (rawQuery) => async (req, res) => {
    try {
        let data = req.body;
        
        // Process the thumbnail image
        if (req.file) {
            const image = `/uploads/products/${req.file.filename}`;
            data.thumbnail = image; 
            console.log("thumbnail:", data.thumbnail)
        }

        // Process additional array of images
        if (req.files) {
            const thumbnailFile = req.files.thumbnail[0];
            const image = `/uploads/products/${thumbnailFile.filename}`;
            data.thumbnail = image; 

            const imagesArray = req.files.images.map(file => `/uploads/products/${file.filename}`);
            data.images = JSON.stringify(imagesArray);
        }

        // Execute the raw SQL query with replacements (sanitization)
        const [result] = await sequelize.query(rawQuery, {
            replacements: data,
            type: QueryTypes.INSERT 
        });

        // Send the result
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const handleReadAll = (rawQuery, table) => async (req, res) => {
    try {
        const { page = 1, limit = 20, ...filters } = req.query;
        const parsedLimit = parseInt(limit, 10) || 20; // Default to 20 if limit is invalid
        const skip = (page - 1) * parsedLimit;
        console.log(parsedLimit, skip)

        // Prepare replacements for the main query
        const replacements = { limit: parsedLimit, offset: skip, ...filters };

        // Execute the main query with replacements
        const docs = await sequelize.query(rawQuery, {
            replacements: replacements,
            type: QueryTypes.SELECT
        });

        // Prepare the count query
        const countQuery = `
            SELECT COUNT(*) as totalItems 
            FROM (${table})
        `;

        // Execute the count query with filters
        const [countResult] = await sequelize.query(countQuery, {
            replacements: { ...filters },
            type: QueryTypes.SELECT
        });

        const totalItems = parseInt(countResult.totalItems, 10);
        const totalPages = Math.ceil(totalItems / parsedLimit);

        // Respond with data and pagination info
        res.status(200).json({
            success: true,
            data: docs,
            pagination: {
                totalItems,
                totalPages,
                currentPage: parseInt(page, 10),
                pageSize: parsedLimit
            }
        });
    } catch (error) {
        console.error('Error reading records:', error);
        res.status(400).json({ error: error.message });
    }
};


// Read a document by ID using raw SQL
const handleReadById = (rawQuery) => async (req, res) => {
    try {
        const { id } = req.params;

        

        // Execute the query with the ID
        const [doc] = await sequelize.query(rawQuery, {
            replacements: { id },
            type: QueryTypes.SELECT
        });

        if (!doc) throw new Error('Document not found');

        res.status(200).json({ success: true, data: doc });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const handleUpdateById = (table) => async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (!id) {
            return res.status(400).json({ error: 'ID parameter is required' });
        }

        // Process the thumbnail image
        if (req.file) {
            const image = `/uploads/products/${req.file.filename}`;
            updates.thumbnail = image; 
            console.log("thumbnail:", updates.thumbnail)
        }

        // thumbnail with images. 
        if (req.files) {
            if(req.files.thumbnail){
                const thumbnailFile = req.files.thumbnail[0];
                const image = `/uploads/products/${thumbnailFile.filename}`;
                updates.thumbnail = image;
            }
             if(req.files.images){
                const imagesArray = req.files.images.map(file => `/uploads/products/${file.filename}`);
                updates.images = JSON.stringify(imagesArray);
             }
            
        }

        // Build the SET clause dynamically
        const updateKeys = Object.keys(updates);
        if (updateKeys.length === 0 ) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        const setClause = updateKeys.map(key => `${key} = :${key}`).join(', ');
        const query = `
            UPDATE ${table} 
            SET ${setClause}
            WHERE id = :id
        `;

        // Add the ID to the updates object for replacement
        const replacements = { id, ...updates };

        // Execute the query
        await sequelize.query(query, {
            replacements,
            type: QueryTypes.UPDATE
        });

        res.status(200).json({ success: true, message: 'Category updated successfully' });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(400).json({ error: error.message });
    }
};


// Delete a document by ID using raw SQL
const handleDeleteById = (rawQuery, table) => async (req, res) => {
    try {
        const { id } = req.params;

        // Read the document before deleting
        const readDocQuery = `SELECT * FROM (${table}) WHERE id = :id`; // Adjust table name
        const [doc] = await sequelize.query(readDocQuery, {
            replacements: { id },
            type: QueryTypes.SELECT
        });

        if (!doc) throw new Error('Document not found');

        // Delete the document
        await sequelize.query(rawQuery, {
            replacements: { id },
            type: QueryTypes.DELETE
        });

        res.status(200).json({ success: true, data: doc });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    handleCreate,
    handleReadAll,
    handleReadById,
    handleUpdateById,
    handleDeleteById
};
