const Patient = require('../../models/Patient');
const {Op} = require('sequelize')

// POST: Create a new patient
const createPatientByReceptionist = async (req, res) => {
    const { name, age, gender } = req.body;

    // Validate mandatory fields
    if (!name || !age || !gender ) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    try {
        const newPatient = await Patient.create({
            name,
            age,
            gender,
            status: 'pending', // Default status is 'pending'
        });

        return res.status(201).json({ success: true, message: 'patient registered successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error creating patient', error: error.message });
    }
};

// PUT: Update patient with procedure charges and next appointment, change status to closed
const updatePatientbyDoctor = async (req, res) => {
    const { id } = req.params; // Patient ID from URL params
    const { fees, procedure_name, procedure_charges, next_appointment } = req.body;

    try {
        const patient = await Patient.findByPk(id);
        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }

        patient.fees = fees || patient.fees;
        patient.procedure_name = procedure_name || patient.procedure_name;
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

// GET: Get all patients with status 'closed': for doctor only
const getClosedPatients = async (req, res) => { // for today only 
    const now = new Date(); // Get the current date and time

    try {
        // Create a start date for the current day (midnight)
        const startDate = new Date(now.setHours(0, 0, 0, 0)); // Start of the current day (00:00:00.000)
        const endDate = new Date(now.setHours(23, 59, 59, 999)); // End of the current day (23:59:59.999)

        const patients = await Patient.findAll({
            where: {
                status: 'closed',
                createdAt: {
                    [Op.gte]: startDate, // Greater than or equal to the start of the day
                    [Op.lte]: endDate,   // Less than or equal to the end of the day
                }
            }
        });

        return res.status(200).json({ success: true, totalPatientsToday: patients.length, patients });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching patients', error: error.message });
    }
};

module.exports = {
    createPatientByReceptionist,
    updatePatientbyDoctor,
    getPendingPatients,
    getClosedPatients,
};
