const { Op } = require('sequelize'); // Sequelize operators
const { sanitize } = require('express-validator');


// Create a new record in the database
const createOne = async (Model, data) => {
    try {
        const doc = await Model.create(data);
        return doc;
    } catch (error) {
        throw new Error(error.message);
    }
};

// Read all records with pagination and filters
const readAll = async (Model, query = {}) => {
    try {
        const { page = 1, limit = 20, ...filters } = query;
        const skip = (page - 1) * limit;

        // Apply filters to the Sequelize query
        const docs = await Model.findAll({
            where: filters,
            offset: skip,
            limit: parseInt(limit, 10)
        });

        // Count total records
        const totalItems = await Model.count({
            where: filters
        });
        const totalPages = Math.ceil(totalItems / limit);

        return {
            status: true,
            data: docs,
            pagination: {
                totalItems,
                totalPages,
                currentPage: parseInt(page, 10),
                pageSize: parseInt(limit, 10)
            }
        };
    } catch (error) {
        throw new Error(error.message);
    }
};


// Find a document by ID
const readById = async (Model, id) => {
    try {
        const doc = await Model.findByPk(id);
        if (!doc) throw new Error('Document not found');
        return doc;
    } catch (error) {
        throw new Error(error.message);
    }
};

// Update a document by ID
const updateById = async (Model, id, data) => {
    try {
        // Perform the update operation
        const [affectedRows] = await Model.update(data, { where: { id } });

        // Check if any rows were affected
        if (affectedRows === 0) throw new Error('Document not found');

        // Fetch the updated record
        const updatedRecord = await Model.findByPk(id);
        if (!updatedRecord) throw new Error('Failed to retrieve updated document');

        return updatedRecord;
    } catch (error) {
        // Log and rethrow the error
        console.error('Error updating record:', error.message);
        throw new Error(error.message);
    }
};


// Delete a document by ID
const deleteById = async (Model, id) => {
    try {
        const doc = await readById(Model, id);
        await doc.destroy();
        return doc;
    } catch (error) {
        throw new Error(error.message);
    }
};

// Handler for creating a document
const handleCreate = (Model) => async (req, res) => {
    try {

        const doc = await createOne(Model, req.body);
        res.status(201).json(doc);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Handler for reading all documents
const handleReadAll = (Model) => {
    return async (req, res) => {
        try {
            // console.log('Received query parameters:', req.query);

            // Call readAll with the query parameters
            const result = await readAll(Model, req.query);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ error: error });
        }
    };
};

// Handler for reading a document by ID
const handleReadById = (Model) => async (req, res) => {
    try {
        const doc = await readById(Model, req.params.id);
        res.status(200).json(doc);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Handler for updating a document by ID
const handleUpdateById = (Model) => async (req, res) => {
    try {
        const doc = await updateById(Model, req.params.id, req.body);
        res.status(200).json(doc);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Handler for deleting a document by ID
const handleDeleteById = (Model) => async (req, res) => {
    try {
        const doc = await deleteById(Model, req.params.id);
        res.status(200).json(doc);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Export functions
module.exports = {
    createOne,
    readAll,
    readById,
    updateById,
    deleteById,
    handleCreate,
    handleReadAll,
    handleReadById,
    handleUpdateById,
    handleDeleteById
};
