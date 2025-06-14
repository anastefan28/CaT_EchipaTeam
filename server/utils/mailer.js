import nodemailer from "nodemailer";

export async function sendConfirmationEmail(email, token) {
  const link = `http://localhost:8000/api/auth/confirm-email?token=${token}`;

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: '"CampSpot" <no-reply@campspot.com>',
      to: email,
      subject: "Please confirm your email",
      html: `<h2>Welcome to CampSpot!</h2>
               <p>Click the link to activate your account:</p>
               <a href="${link}">${link}</a>`,
    });

    console.log("Email sent:", info.messageId);
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}
