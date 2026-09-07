require("dotenv").config();

const express = require("express");
const nodemailer = require("nodemailer");

const app = express();

const PORT = process.env.PORT || 3000;


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Serve the website
app.use(express.static("public"));


// Email configuration
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});


// Appointment endpoint
app.post("/api/appointments", async (req, res) => {

    const {
        firstName,
        lastName,
        phone,
        email,
        treatment,
        message
    } = req.body;


    console.log("NEW APPOINTMENT REQUEST");
    console.log("-------------------------");

    console.log("Name:", firstName, lastName);
    console.log("Phone:", phone);
    console.log("Email:", email);
    console.log("Treatment:", treatment);
    console.log("Message:", message);


    try {

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: "New Appointment Request",

            text:
`NEW APPOINTMENT REQUEST

Patient: ${firstName} ${lastName}
Phone: ${phone}
Email: ${email}
Treatment: ${treatment}

Message:
${message}`
        });


        console.log("Email notification sent successfully.");


        res.json({
            success: true,
            message: "Appointment request received and email sent."
        });


    } catch (error) {

        console.error("Email could not be sent:", error);

        res.status(500).json({
            success: false,
            message: "Appointment received, but email notification failed."
        });

    }

});


// Start server
app.listen(PORT, () => {

    console.log(`Server running at http://localhost:${PORT}`);

});