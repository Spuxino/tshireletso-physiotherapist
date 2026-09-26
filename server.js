require("dotenv").config();

const express = require("express");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================================
   EXPRESS SETUP
========================================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));
app.get("/reply.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "reply.html"));
});

/* =========================================
   EMAIL TRANSPORTER
========================================= */

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});


/* =========================================
   CONFIGURATION
========================================= */

const PRACTICE_EMAIL = "tshireletsophysio.1@gmail.com";

const SITE_URL =
    process.env.SITE_URL ||
    "https://tshireletsophysiotherapist.com";

const REPLY_SECRET =
    process.env.REPLY_SECRET ||
    "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET";


/* =========================================
   HTML ESCAPE
========================================= */

function escapeHtml(value = "") {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================
   FORMAT MESSAGE FOR HTML
========================================= */

function formatMessage(message = "") {
    return escapeHtml(message)
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/\n/g, "<br>");
}


/* =========================================
   CREATE SECURE REPLY TOKEN
========================================= */

function createReplyToken(data) {

    const payload = {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        treatment: data.treatment,
        phone: data.phone,
        message: data.message,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000)
    };

    const encodedPayload = Buffer
        .from(JSON.stringify(payload))
        .toString("base64url");

    const signature = crypto
        .createHmac("sha256", REPLY_SECRET)
        .update(encodedPayload)
        .digest("base64url");

    return `${encodedPayload}.${signature}`;
}


/* =========================================
   VERIFY REPLY TOKEN
========================================= */

function verifyReplyToken(token) {

    try {

        if (!token || !token.includes(".")) {
            return null;
        }

        const parts = token.split(".");

        if (parts.length !== 2) {
            return null;
        }

        const encodedPayload = parts[0];
        const providedSignature = parts[1];

        const expectedSignature = crypto
            .createHmac("sha256", REPLY_SECRET)
            .update(encodedPayload)
            .digest("base64url");

        const signaturesMatch = crypto.timingSafeEqual(
            Buffer.from(providedSignature),
            Buffer.from(expectedSignature)
        );

        if (!signaturesMatch) {
            return null;
        }

        const payload = JSON.parse(
            Buffer.from(encodedPayload, "base64url").toString("utf8")
        );

        if (!payload.expiresAt || Date.now() > payload.expiresAt) {
            return null;
        }

        return payload;

    } catch (error) {

        console.error("Reply token verification failed:", error);

        return null;
    }
}


/* =========================================
   HEALTH CHECK
========================================= */

app.get("/api/health", (req, res) => {

    res.json({
        success: true,
        message: "Tshireletso Physiotherapist server is running."
    });

});


/* =========================================
   APPOINTMENT REQUEST
========================================= */

app.post("/api/appointments", async (req, res) => {

    const {
        firstName,
        lastName,
        phone,
        email,
        treatment,
        message
    } = req.body;

    /* -----------------------------------------
       VALIDATION
    ----------------------------------------- */

    if (
        !firstName ||
        !lastName ||
        !phone ||
        !email ||
        !treatment
    ) {

        return res.status(400).json({
            success: false,
            message: "Please complete all required fields."
        });

    }


    /* -----------------------------------------
       CREATE REPLY TOKEN
    ----------------------------------------- */

    const replyToken = createReplyToken({
        email,
        firstName,
        lastName,
        phone,
        treatment,
        message: message || ""
    });


    const replyUrl =
        `${SITE_URL}/reply.html?token=${encodeURIComponent(replyToken)}`;

console.log("REPLY URL:", replyUrl);
    /* =========================================
       PRACTICE EMAIL
    ========================================= */

    const practiceHtml = `

<!DOCTYPE html>
<html>
<head>

<meta charset="UTF-8">

<meta name="viewport"
      content="width=device-width, initial-scale=1.0">

<title>New Appointment Request</title>

</head>

<body style="
    margin:0;
    padding:0;
    background:#f4f7fb;
    font-family:Arial, Helvetica, sans-serif;
">

<table width="100%"
       cellpadding="0"
       cellspacing="0"
       border="0"
       style="background:#f4f7fb; padding:30px 15px;">

<tr>
<td align="center">

<table width="600"
       cellpadding="0"
       cellspacing="0"
       border="0"
       style="
           max-width:600px;
           width:100%;
           background:#ffffff;
           border-radius:14px;
           overflow:hidden;
           box-shadow:0 4px 18px rgba(0,0,0,0.08);
       ">

<!-- HEADER -->

<tr>
<td align="center"
    style="
        padding:30px 25px;
        background:#ffffff;
        border-bottom:1px solid #e8edf3;
    ">

<img
    src="cid:tshireletso-logo-practice"
    alt="Tshireletso Physiotherapist"
    style="
        max-width:220px;
        width:100%;
        height:auto;
        display:block;
    "
>

</td>
</tr>


<!-- CONTENT -->

<tr>
<td style="padding:35px 30px;">

<h1 style="
    margin:0 0 10px 0;
    color:#17324d;
    font-size:26px;
    line-height:1.3;
">

New Appointment Request

</h1>

<p style="
    margin:0 0 25px 0;
    color:#667085;
    font-size:15px;
    line-height:1.6;
">

A new patient has submitted an appointment request through the website.

</p>


<!-- PATIENT CARD -->

<table width="100%"
       cellpadding="0"
       cellspacing="0"
       border="0"
       style="
           background:#f7f9fc;
           border:1px solid #e5eaf0;
           border-radius:10px;
           margin-bottom:25px;
       ">

<tr>
<td style="padding:20px;">

<p style="margin:0 0 12px 0;">
<strong style="color:#17324d;">Patient</strong><br>
<span style="color:#555;">
${escapeHtml(firstName)} ${escapeHtml(lastName)}
</span>
</p>

<p style="margin:0 0 12px 0;">
<strong style="color:#17324d;">Phone</strong><br>
<span style="color:#555;">
${escapeHtml(phone)}
</span>
</p>

<p style="margin:0 0 12px 0;">
<strong style="color:#17324d;">Email</strong><br>
<span style="color:#555;">
${escapeHtml(email)}
</span>
</p>

<p style="margin:0;">
<strong style="color:#17324d;">Treatment</strong><br>
<span style="color:#555;">
${escapeHtml(treatment)}
</span>
</p>

</td>
</tr>

</table>


<!-- MESSAGE -->

<h3 style="
    margin:0 0 10px 0;
    color:#17324d;
    font-size:17px;
">

Patient Message

</h3>

<div style="
    background:#ffffff;
    border-left:4px solid #17324d;
    padding:15px 18px;
    margin-bottom:30px;
    color:#555;
    font-size:15px;
    line-height:1.7;
">

${message ? formatMessage(message) : "No additional message was provided."}

</div>


<!-- REPLY BUTTON -->

<table width="100%"
       cellpadding="0"
       cellspacing="0"
       border="0"
       style="margin-bottom:25px;">

<tr>
<td align="center">

<a href="${replyUrl}"
   style="
       display:inline-block;
       background:#17324d;
       color:#ffffff;
       text-decoration:none;
       padding:15px 28px;
       border-radius:8px;
       font-size:15px;
       font-weight:bold;
   ">

Reply to Patient

</a>

</td>
</tr>

</table>

<p style="
    margin:0;
    text-align:center;
    color:#8a94a6;
    font-size:12px;
    line-height:1.6;
">

This reply button is valid for 24 hours.

</p>

</td>
</tr>


<!-- FOOTER -->

<tr>
<td align="center"
    style="
        padding:25px 20px;
        background:#f7f9fc;
        border-top:1px solid #e8edf3;
    ">

<p style="
    margin:0 0 6px 0;
    color:#17324d;
    font-size:15px;
    font-weight:bold;
">

Tshireletso Physiotherapist

</p>

<p style="
    margin:0 0 8px 0;
    color:#667085;
    font-size:13px;
">

Wellness through personalised care

</p>

<p style="
    margin:0;
    color:#667085;
    font-size:12px;
    line-height:1.7;
">

+27 62 596 6725<br>
tshireletsophysio@gmail.com

</p>

</td>
</tr>

</table>

</td>
</tr>

</table>

</body>
</html>

`;


    const practiceText = `
NEW APPOINTMENT REQUEST

Patient:
${firstName} ${lastName}

Phone:
${phone}

Email:
${email}

Treatment:
${treatment}

Message:
${message || "No additional message was provided."}

Reply to Patient:
${replyUrl}

Tshireletso Physiotherapist
Wellness through personalised care
+27 62 596 6725
tshireletsophysio@gmail.com
`;


    /* =========================================
       CLIENT EMAIL
    ========================================= */

    const clientHtml = `

<!DOCTYPE html>
<html>
<head>

<meta charset="UTF-8">

<meta name="viewport"
      content="width=device-width, initial-scale=1.0">

<title>Appointment Request Received</title>

</head>

<body style="
    margin:0;
    padding:0;
    background:#f4f7fb;
    font-family:Arial, Helvetica, sans-serif;
">

<table width="100%"
       cellpadding="0"
       cellspacing="0"
       border="0"
       style="background:#f4f7fb; padding:30px 15px;">

<tr>
<td align="center">

<table width="600"
       cellpadding="0"
       cellspacing="0"
       border="0"
       style="
           max-width:600px;
           width:100%;
           background:#ffffff;
           border-radius:14px;
           overflow:hidden;
           box-shadow:0 4px 18px rgba(0,0,0,0.08);
       ">


<!-- HEADER -->

<tr>
<td align="center"
    style="
        padding:30px 25px;
        background:#ffffff;
        border-bottom:1px solid #e8edf3;
    ">

<img
    src="cid:tshireletso-logo-client"
    alt="Tshireletso Physiotherapist"
    style="
        max-width:220px;
        width:100%;
        height:auto;
        display:block;
    "
>

</td>
</tr>


<!-- CONTENT -->

<tr>
<td style="padding:35px 30px;">

<h1 style="
    margin:0 0 12px 0;
    color:#17324d;
    font-size:26px;
">

Thank You, ${escapeHtml(firstName)}

</h1>

<p style="
    margin:0 0 20px 0;
    color:#555;
    font-size:15px;
    line-height:1.7;
">

Thank you for contacting Tshireletso Physiotherapist.

We have received your appointment request and our team will review your request and contact you to confirm your appointment.

</p>


<!-- APPOINTMENT CARD -->

<table width="100%"
       cellpadding="0"
       cellspacing="0"
       border="0"
       style="
           background:#f7f9fc;
           border:1px solid #e5eaf0;
           border-radius:10px;
       ">

<tr>
<td style="padding:20px;">

<p style="margin:0 0 12px 0;">
<strong style="color:#17324d;">Patient</strong><br>
<span style="color:#555;">
${escapeHtml(firstName)} ${escapeHtml(lastName)}
</span>
</p>

<p style="margin:0 0 12px 0;">
<strong style="color:#17324d;">Treatment</strong><br>
<span style="color:#555;">
${escapeHtml(treatment)}
</span>
</p>

<p style="margin:0;">
<strong style="color:#17324d;">Phone</strong><br>
<span style="color:#555;">
${escapeHtml(phone)}
</span>
</p>

</td>
</tr>

</table>


<p style="
    margin:25px 0 0 0;
    color:#667085;
    font-size:14px;
    line-height:1.7;
">

Please note that this email confirms receipt of your request. Your appointment will only be confirmed once the practice has contacted you.

</p>

</td>
</tr>


<!-- FOOTER -->

<tr>
<td align="center"
    style="
        padding:25px 20px;
        background:#f7f9fc;
        border-top:1px solid #e8edf3;
    ">

<p style="
    margin:0 0 6px 0;
    color:#17324d;
    font-size:15px;
    font-weight:bold;
">

Tshireletso Physiotherapist

</p>

<p style="
    margin:0 0 8px 0;
    color:#667085;
    font-size:13px;
">

Wellness through personalised care

</p>

<p style="
    margin:0;
    color:#667085;
    font-size:12px;
    line-height:1.7;
">

+27 62 596 6725<br>
tshireletsophysio@gmail.com

</p>

</td>
</tr>

</table>

</td>
</tr>

</table>

</body>
</html>

`;


    const clientText = `
Thank You, ${firstName}

Thank you for contacting Tshireletso Physiotherapist.

We have received your appointment request and our team will review your request and contact you to confirm your appointment.

Appointment details:

Patient:
${firstName} ${lastName}

Treatment:
${treatment}

Phone:
${phone}

Please note that this email confirms receipt of your request. Your appointment will only be confirmed once the practice has contacted you.

Tshireletso Physiotherapist
Wellness through personalised care
+27 62 596 6725
tshireletsophysio@gmail.com
`;


    /* =========================================
       SEND EMAILS
    ========================================= */

    try {

        /* -----------------------------------------
           PRACTICE EMAIL
        ----------------------------------------- */

        await transporter.sendMail({

            from: `"Tshireletso Physiotherapist" <${process.env.EMAIL_USER}>`,

            to: PRACTICE_EMAIL,

            subject: `New Appointment Request — ${firstName} ${lastName}`,

            text: practiceText,

            html: practiceHtml,

            attachments: [

                {
                    filename: "tshireletso-logo.png",
                    path: "./public/images/logo.png",
                    cid: "tshireletso-logo-practice"
                }

            ]

        });

        console.log("✓ Practice notification sent successfully.");


        /* -----------------------------------------
           CLIENT EMAIL
        ----------------------------------------- */

        await transporter.sendMail({

            from: `"Tshireletso Physiotherapist" <${process.env.EMAIL_USER}>`,

            to: email,

            subject: "Appointment Request Received — Tshireletso Physiotherapist",

            text: clientText,

            html: clientHtml,

            attachments: [

                {
                    filename: "tshireletso-logo.png",
                    path: "./public/images/logo.png",
                    cid: "tshireletso-logo-client"
                }

            ]

        });

        console.log("✓ Client confirmation email sent successfully.");

        console.log("ALL EMAILS SENT SUCCESSFULLY");


        /* -----------------------------------------
           RESPONSE
        ----------------------------------------- */

        res.json({

            success: true,

            message:
                "Your appointment request has been submitted successfully."

        });


    } catch (error) {

        console.error("EMAIL ERROR:", error);

        res.status(500).json({

            success: false,

            message:
                "Your request was received, but we could not send the confirmation email."

        });

    }

});


/* =========================================
   REPLY PAGE
========================================= */

app.get("/api/reply-details", (req, res) => {

    const { token } = req.query;

    const patient = verifyReplyToken(token);

    if (!patient) {

        return res.status(401).json({

            success: false,

            message:
                "This reply link is invalid or has expired."

        });

    }


    res.json({

        success: true,

        patient: {

            firstName: patient.firstName,

            lastName: patient.lastName,

            email: patient.email,

            phone: patient.phone,

            treatment: patient.treatment,

            message: patient.message

        }

    });

});


/* =========================================
   SEND REPLY TO PATIENT
========================================= */

app.post("/api/reply", async (req, res) => {

    const {
        token,
        subject,
        message
    } = req.body;


    /* -----------------------------------------
       VERIFY TOKEN
    ----------------------------------------- */

    const patient = verifyReplyToken(token);

    if (!patient) {

        return res.status(401).json({

            success: false,

            message:
                "This reply link is invalid or has expired."

        });

    }


    /* -----------------------------------------
       VALIDATION
    ----------------------------------------- */

    if (!message || !message.trim()) {

        return res.status(400).json({

            success: false,

            message:
                "Please enter a message before sending."

        });

    }


    const cleanSubject =
        subject && subject.trim()
            ? subject.trim()
            : "Reply from Tshireletso Physiotherapist";


    /* -----------------------------------------
       HTML EMAIL
    ----------------------------------------- */

    const replyHtml = `

<!DOCTYPE html>
<html>

<head>

<meta charset="UTF-8">

<meta name="viewport"
      content="width=device-width, initial-scale=1.0">

<title>${escapeHtml(cleanSubject)}</title>

</head>


<body style="
    margin:0;
    padding:0;
    background:#f4f7fb;
    font-family:Arial, Helvetica, sans-serif;
">


<table width="100%"
       cellpadding="0"
       cellspacing="0"
       border="0"
       style="
           background:#f4f7fb;
           padding:30px 15px;
       ">

<tr>

<td align="center">


<table width="600"
       cellpadding="0"
       cellspacing="0"
       border="0"
       style="
           max-width:600px;
           width:100%;
           background:#ffffff;
           border-radius:14px;
           overflow:hidden;
           box-shadow:0 4px 18px rgba(0,0,0,0.08);
       ">


<!-- HEADER -->

<tr>

<td align="center"
    style="
        padding:30px 25px;
        border-bottom:1px solid #e8edf3;
    ">

<img
    src="cid:tshireletso-logo-reply"
    alt="Tshireletso Physiotherapist"
    style="
        max-width:220px;
        width:100%;
        height:auto;
        display:block;
    "
>

</td>

</tr>


<!-- CONTENT -->

<tr>

<td style="
    padding:35px 30px;
">


<h1 style="
    margin:0 0 15px 0;
    color:#17324d;
    font-size:25px;
">

Dear ${escapeHtml(patient.firstName)}

</h1>


<div style="
    color:#555;
    font-size:15px;
    line-height:1.8;
">

${formatMessage(message)}

</div>


<!-- SIGNATURE -->

<div style="
    margin-top:30px;
    padding-top:20px;
    border-top:1px solid #e5eaf0;
">

<p style="
    margin:0 0 5px 0;
    color:#17324d;
    font-weight:bold;
">

Tshireletso Thindisa

</p>

<p style="
    margin:0 0 3px 0;
    color:#667085;
    font-size:13px;
">

Tshireletso Physiotherapist

</p>

<p style="
    margin:0;
    color:#667085;
    font-size:13px;
">

Wellness through personalised care

</p>

</div>


</td>

</tr>


<!-- FOOTER -->

<tr>

<td align="center"
    style="
        padding:25px 20px;
        background:#f7f9fc;
        border-top:1px solid #e8edf3;
    ">

<p style="
    margin:0 0 6px 0;
    color:#17324d;
    font-size:14px;
    font-weight:bold;
">

Tshireletso Physiotherapist

</p>

<p style="
    margin:0;
    color:#667085;
    font-size:12px;
    line-height:1.7;
">

+27 62 596 6725<br>
tshireletsophysio@gmail.com

</p>

</td>

</tr>


</table>

</td>

</tr>

</table>


</body>

</html>

`;


    /* =========================================
       PLAIN TEXT FALLBACK
    ========================================= */

    const replyText = `
Dear ${patient.firstName},

${message}

Tshireletso Thindisa
Tshireletso Physiotherapist
Wellness through personalised care

+27 62 596 6725
tshireletsophysio@gmail.com
`;


    /* =========================================
       SEND REPLY
    ========================================= */

    try {

        await transporter.sendMail({

            from:
                `"Tshireletso Physiotherapist" <${process.env.EMAIL_USER}>`,

            to: patient.email,

            subject: cleanSubject.startsWith("Re:")
                ? cleanSubject
                : `Re: ${cleanSubject}`,

            text: replyText,

            html: replyHtml,

            attachments: [

                {
                    filename: "tshireletso-logo.png",
                    path: "./public/images/logo.png",
                    cid: "tshireletso-logo-reply"
                }

            ]

        });


        console.log(
            `✓ Reply email sent successfully to ${patient.email}`
        );


        res.json({

            success: true,

            message:
                "Reply sent successfully to the patient."

        });


    } catch (error) {

        console.error("REPLY EMAIL ERROR:", error);

        res.status(500).json({

            success: false,

            message:
                "We could not send the reply. Please try again."

        });

    }

});


/* =========================================
   START SERVER
========================================= */

app.listen(PORT, () => {

    console.log("");
    console.log("=========================================");
    console.log(" TSHIRELETSO PHYSIOTHERAPIST SERVER");
    console.log("=========================================");
    console.log(` Server running on port ${PORT}`);
    console.log(` Website: ${SITE_URL}`);
    console.log(" Email system: READY");
    console.log(" Reply system: READY");
    console.log("=========================================");
    console.log("");

});
