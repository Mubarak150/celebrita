// controllers/settingsController.js
const Settings  = require("../models/Settings");

const updateThreshold = async (req, res) => {
  const { newThreshold } = req.body;

  try {
    // Find or create the threshold setting
    const [thresholdSetting, created] = await Settings.findOrCreate({
      where: { key: "quantityThreshold" },
      defaults: { value: newThreshold },
    });

    // Update the threshold if it already exists
    if (!created) {
      thresholdSetting.value = newThreshold;
      await thresholdSetting.save();
    }

    res.status(200).json({ status: true, message: "Threshold updated successfully" });
  } catch (error) {
    res.status(500).json({ status: false, message: "Failed to update threshold" });
  }
};

module.exports = { updateThreshold };
