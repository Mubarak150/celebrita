const Test = require('../../models/Test');
const { QueryTypes } = require('sequelize');
const { handleCreate, handleReadAll, handleReadById, handleUpdateById, handleDeleteById } = require('../../utils/functions');

exports.createTest = handleCreate(`
    INSERT INTO tests ( thumbnail)
    VALUES (:thumbnail);
`);
