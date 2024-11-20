const Patient = require('../../models/Patient');
const {Op} = require('sequelize'); 
const {notifyAllDoctors, notifyAllReceptionists} = require('../../utils/socket'); 

// POST: Create a new patient
const createPatientByReceptionist = async (req, res) => { // done
    const { name, age, gender, contact, address, fee_status } = req.body;
    
    // Validate mandatory fields
    if (!name || !age || !gender || !contact || !address   ) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    try {
        const newPatient = await Patient.create({
            name,
            age,
            gender, 
            contact, 
            address, 
            fee_status,
            status: 'pending', // Default status is 'pending'
        });

        // send a notification to doctor that  a new entry has been made..
        const notification = 'A new patient has been added.'; 
        await notifyAllDoctors(notification)

        // finally return the json...
        return res.status(201).json({ success: true, message: 'A patient added successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error creating patient', error: error.message });
    }
};

// PUT: Update patient with procedure charges and next appointment, change status to closed
const updatePatientbyDoctor = async (req, res) => {
    const { id } = req.params; // Patient ID from URL params
    const { comments, prescription, procedure_name, procedure_charges, next_appointment } = req.body;

    try {
        const patient = await Patient.findByPk(id);
        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }

        patient.comments = comments || patient.comments;
        patient.prescription = prescription || patient.prescription;
        patient.procedure_name = procedure_name || patient.procedure_name;
        patient.procedure_charges = procedure_charges || patient.procedure_charges; // retain old value if new not provided or are problematic
        patient.next_appointment = next_appointment || patient.next_appointment;
        patient.status = 'billing'; // Update status to 'billing'

        await patient.save(); // 

        // send a notification to doctor that  a new entry has been made..
        const notification = `A patient was pushed into billing.`; 
        await notifyAllReceptionists(notification)

        return res.status(200).json({ success: true, message: 'Patient updated successfully', patient });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error updating patient', error: error.message });
    }
};

const updatePatientAtReception = async (req, res) => {
    const { id } = req.params; // Assume the patient ID is passed as a URL parameter
    const updates = req.body;   // Assume the updated data is passed in the request body
  
    try {
      // Find the patient by ID
      const patient = await Patient.findByPk(id);
  
      // If the patient is not found, return a 404 error
      if (!patient) {
        return res.status(404).json({ status: false,  message: 'Patient not found' });
      }
  
      // Update the patient with the data provided in the request body
      await patient.update(updates);

      // send a notification to doctor that  a new entry has been made..
      const notification = `A patient's info. got updated.`; 
      await notifyAllDoctors(notification)
  
      // Return the updated patient information
      return res.status(200).json({ status: true,  message: 'Patient updated successfully', patient });
    } catch (error) {
      return res.status(500).json({ status: false,  message: 'An error occurred while updating the patient' });
    }
  };

const updatePatientToClose = async (req, res) => {
    const { id } = req.params; // Assume the patient ID is passed as a URL parameter
  
    try {
      // Find the patient by ID
      const patient = await Patient.findByPk(id);
  
      // If the patient is not found, return a 404 error
      if (!patient) {
        return res.status(404).json({ status: false,  message: 'Patient not found' });
      }

      // check if patient is in billing
      if (patient.status != 'billing') {
        return res.status(400).json({ status: false,  message: 'Invoice can only be generated for Billed Patients' });
      }
  
      // Update the patient status
      patient.status = 'closed'
      await patient.save();

      // send a notification to doctor about the update..
      const notification = `A patient's status was set to closed.`; 
      await notifyAllDoctors(notification)
  
      // Return the updated patient information
      return res.status(200).json({ status: true,  message: 'Patient status set closed successfully', patient });
    } catch (error) {
      return res.status(500).json({ status: false,  message: "An error occurred while closing the patient's status"});
    }
}
  

const getAllPatients = async (req, res) => {
    const { date, status } = req.query; // Get the date from the request body.. set status to active

    try {
        // If date is provided in the request body, use it, otherwise default to today's date
        const providedDate = date ? new Date(date) : new Date();

        // Create start date and end date for the provided or current day
        const startDate = new Date(providedDate.setHours(0, 0, 0, 0)); // Start of the day (00:00:00.000)
        const endDate = new Date(providedDate.setHours(23, 59, 59, 999)); // End of the day (23:59:59.999)

        // Fetch patients with status 'closed' for the specified day
        const patients = await Patient.findAll({
            where: {
                createdAt: {
                    [Op.gte]: startDate, // Greater than or equal to the start of the day
                    [Op.lte]: endDate    // Less than or equal to the end of the day
                }
            }
        });

        return res.status(200).json({ success: true, totalPatients: patients.length, patients });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching patients', error: error.message });
    }
};

const getPatientById = async (req, res) => {
    const {id} = req.params;
    try {
                
        const patient = await Patient.findOne({
            where: { id }
        }); 

        if(!patient) {
            return res.status(404).json({ success: false, message: 'No patient found with this ID', error: error.message });
        }

        return res.status(200).json({ success: true, patient });

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching patient with this ID', error: error.message });
    }
}

// with the insertion of socket, it is not needed primarily... but yep.. still needed. 
const getActivePatient = async (req, res) => {
    try {
        const activePatient = await Patient.findOne({where: {status: 'active'}});
        if(!activePatient) {
            return res.status(500).json({
                status: false, 
                message: 'no active patient found'
            })
        }

        const patient_in_queue = activePatient.patient_number; 
        res.status(200).json({
            status: true, 
            patient_in_queue
        })
    } catch (error) {
        return res.status(500).json({
            status: false, 
            message: 'error fetching active patient',
            error: error.message
        })
    }
}

const getPatientsForNextCall = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to start of the day

        const twoDaysLater = new Date(today);
        twoDaysLater.setDate(today.getDate() + 2);

        const patients = await Patient.findAll({
            where: {
                next_appointment: twoDaysLater
            },
            attributes: ['id', 'name', 'contact', 'address', 'next_appointment']
        });

        if (!patients || patients.length === 0) {
            return res.status(404).json({
                status: false,
                message: 'No patients found with next appointment two days later'
            });
        }

        res.status(200).json({
            status: true,
            patients
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: 'Error fetching patients',
            error: error.message
        });
    }
};


const setPatientToActive = async (req, res) => {
    const {id} = req.params; 

    try{
        const oldActive = await Patient.findOne({
            where: {status: 'active'}
        }); 

        if(oldActive) {
            oldActive.status = "pending";  // under test... 
            await oldActive.save(); 
        }

        const newActive = await Patient.findOne({ where: {id} }) // SELECT * FROM PATIENTS WHERE ID = :ID LIMIT = 1

        if(!newActive) {
            return res.status(404).json({
                status: false, 
                message: 'no patient found with this ID'
            })
        }

        const patient_in_queue = newActive.patient_number; 

        newActive.status = "active"; 
        await newActive.save()

        // sending the current queue number as notification to all receptionists.
        const notification = patient_in_queue; 
        await notifyAllReceptionists(notification)

        return res.status(200).json({
            status: true, 
            patient_in_queue, 
            message: 'the patient has been successfully set to active'
        })

    } catch (error) {
        return res.status(500).json({
            status: false, 
            message: 'an error occured while activating the patient',
            error: error.message
        })
    }
}

// GET: Get all patients with status 'pending': 
// not in use for now... but as said.. let it be dormant for now. 
const getPendingPatients = async (req, res) => { // let it be dormant for now... 
    try {
        const patients = await Patient.findAll({
            where: { status: 'pending' }, // Fetch only pending patients
        });

        return res.status(200).json({ success: true, patients });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching patients', error: error.message });
    }
};

const deletePatient = async (req, res) => {
    const {id} = req.params; 
    try {
        // Find the patient by ID
        const patient = await Patient.findByPk(id);
    
        // If no patient is found, return a 404 error
        if (!patient) {
          return res.status(404).json({ status: false, message: 'Patient not found' });
        }
    
        // Delete the patient record
        await patient.destroy();

        // send a notification to doctor that  a new entry has been made..
        const notification = 'A patient was deleted from the list.'; 
        await notifyAllDoctors(notification)
    
        // Return success message
        return res.status(200).json({status: true, message: 'Patient deleted successfully' });
    
    } catch (error) {
        res.status(500).json({
            status: false, 
            message: 'an error occured while deleting the patient'
        })
    }
}


module.exports = {
    createPatientByReceptionist,
    updatePatientbyDoctor,
    updatePatientAtReception,
    updatePatientToClose,
    getPendingPatients,
    getAllPatients,
    getPatientsForNextCall,
    getPatientById,
    setPatientToActive,
    getActivePatient,
    deletePatient
};
