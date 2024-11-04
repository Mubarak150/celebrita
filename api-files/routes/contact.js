const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact'); // Adjust the path to your Contact model
const User = require('../models/User'); // Adjust the path to your User model
const nodemailer = require('nodemailer');

// Create a Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, // Replace with your SMTP server address
  port: process.env.EMAIL_PORT, // Use 587 for TLS or 465 for SSL
  secure: false, // Set to true if using port 465
  auth: {
    user: process.env.NODEMAILER_USER, // Your email address
    pass: process.env.NODEMAILER_PASS, // Your email password or app password
  },
});

router.post('/', async (req, res) => {
  const { firstName, lastName, email, phone, message } = req.body;

  if (!firstName || !lastName || !email || !phone || !message) {
    return res.status(400).json({ message: 'All the fields are mandatory' });
  }

  try {
    // Save contact form data to the database
    const contact = await Contact.create({
      firstName,
      lastName,
      email,
      phone,
      message,
    });

    // Find all users with role 1 (admin) who have send_emails set to true
    const admins = await User.findAll({
      where: {
        role: 1, // Admins have role 1
        send_emails: true, // Only those who opted in to receive emails
      },
    });

    const adminEmails = admins.map((admin) => admin.email);

    if (adminEmails.length === 0) {
      return res.status(200).json({ message: 'Contact form submitted, but no admins to notify' });
    }

    // Send email notification to all admins
    const mailOptions = {
      from: process.env.NODEMAILER_USER, // Sender's email address
      to: adminEmails, // Array of admin email addresses
      subject: 'CELEBRITA',
      text: `New contact form submission:\n\nName: ${firstName} ${lastName}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Contact form submitted successfully and admins notified' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error processing contact form submission', error: error.message });
  }
});

module.exports = router;



// const express = require('express');
// const router = express.Router();
// const Contact = require('../models/Contact'); // Adjust the path to your Contact model
// const nodemailer = require('nodemailer');

// // Create a Nodemailer transporter
// const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST, //'smtp.webfrat.com' // Replace with your SMTP server address
//   port: process.env.EMAIL_PORT, // Use 587 for TLS or 465 for SSL
//   secure: false, // Set to true if using port 465
//   auth: {
//     user: process.env.NODEMAILER_USER, // Your email address
//     pass: process.env.NODEMAILER_PASS, // Your email password or app password
//   // }
// });

// router.post('/', async (req, res) => {
//   const { firstName, lastName, email, phone, message } = req.body;

//   if(!firstName || !lastName || !email || !phone || !message ) {
//     return res.status(400).json({message: 'all the fields are mandatory'})
//   }

//   try {
//     // Save contact form data to the database
//     const contact = await Contact.create({
//       firstName,
//       lastName,
//       email,
//       phone, 
//       message,
//     });

//     // Send email notification
//     const mailOptions = {
//       from: process.env.NODEMAILER_USER, // Sender's email address
//       to: process.env.DESTINATION_MAIL, //  owner's email address
//       subject: 'New Contact Form Submission',
//       text: `New contact form submission:\n\nName: ${firstName} ${lastName}\nEmail: ${email}\nMessage: ${message}`,
//     };

//     await transporter.sendMail(mailOptions);

//     res.status(200).json({ message: 'Contact form submitted successfully' });
//   } catch (error) {
//     // console.error(error);
//     res.status(500).json({ message: 'Error processing contact form submission' });
//   }
// });

// module.exports = router;
