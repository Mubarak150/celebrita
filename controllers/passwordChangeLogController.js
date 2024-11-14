const PasswordChangeLog = require('../models/PasswordChangeLog');

const getPasswordChangeLogs = async (req, res) => {
    const logs = await PasswordChangeLog.findAll({
        order: [['change_time', 'DESC']],
    });

    res.status(200).json({ success: true, data: logs });
};

module.exports = { getPasswordChangeLogs }; 
