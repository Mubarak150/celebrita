const Patient = require('../../models/Patient');

// POST: Create a new patient
const createPatient = async (req, res) => {
    const { name, age, gender, procedure_name, fees = 500 } = req.body;

    // Validate mandatory fields
    if (!name || !age || !gender || !procedure_name || !fees) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    try {
        const newPatient = await Patient.create({
            name,
            age,
            gender,
            procedure_name,
            fees,
            status: 'pending', // Default status is 'pending'
        });

        return res.status(201).json({ success: true, message: 'patient registered successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error creating patient', error: error.message });
    }
};

// PUT: Update patient with procedure charges and next appointment, change status to closed
const updatePatient = async (req, res) => {
    const { id } = req.params; // Patient ID from URL params
    const { procedure_charges, next_appointment } = req.body;

    try {
        const patient = await Patient.findByPk(id);
        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }

        patient.procedure_charges = procedure_charges || patient.procedure_charges; // retain old value if new not provided or are problematic
        patient.next_appointment = next_appointment || patient.next_appointment;
        patient.status = 'closed'; // Update status to 'closed'

        await patient.save();

        return res.status(200).json({ success: true, message: 'Patient updated successfully', patient });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error updating patient', error: error.message });
    }
};

// GET: Get all patients with status 'pending'
const getPendingPatients = async (req, res) => {
    try {
        const patients = await Patient.findAll({
            where: { status: 'pending' }, // Fetch only pending patients
        });

        return res.status(200).json({ success: true, patients });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching patients', error: error.message });
    }
};

module.exports = {
    createPatient,
    updatePatient,
    getPendingPatients,
};
