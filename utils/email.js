const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1 create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    // Activate in gmail "less secure app" option
  });
  // 2 define email options
  const mailOptions = {
    from: 'Jonas Schedamn <hello@jonas.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };
  // 3 actually send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
