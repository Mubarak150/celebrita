const { handleCreate, handleReadAll, handleReadById, handleUpdateById, handleDeleteById } = require('../utils/functions');

exports.createDelivery = handleCreate(`
    INSERT INTO deliveries (city, charges) 
    VALUES (:city, :charges)
`);

exports.getAllDeliveries = handleReadAll(`
    SELECT * FROM deliveries 
`, 'deliveries');

exports.getDeliveryById = handleReadById(`
    SELECT * FROM deliveries 
    WHERE id = :id
`);

exports.updateDeliveryById = handleUpdateById("deliveries");

exports.deleteDeliveryById = handleDeleteById(`
    DELETE FROM deliveries 
    WHERE id = :id
`, 'deliveries');
