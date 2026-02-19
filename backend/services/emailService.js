const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = async () => {
  // For development, use Ethereal testing account
  if (process.env.NODE_ENV === 'development') {
    let testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  // For production, use configured SMTP
  return Promise.resolve(nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  }));
};

// Send verification email with 6-digit OTP
const sendVerificationEmail = async (email, verificationCode, userName) => {
  try {
    const transporter = await createTransporter();
    
    const mailOptions = {
      from: `"Flutter Learning Platform" <${process.env.EMAIL_USER || 'noreply@flutterlearning.com'}>`,
      to: email,
      subject: 'Verify Your Email - Flutter Learning Platform',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f4f4f4;
            }
            .container {
              background-color: #ffffff;
              border-radius: 10px;
              padding: 30px;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              width: 60px;
              height: 60px;
              border-radius: 15px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 20px;
              font-size: 24px;
              font-weight: bold;
            }
            .otp-container {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              font-size: 48px;
              font-weight: bold;
              padding: 30px;
              text-align: center;
              border-radius: 15px;
              margin: 30px 0;
              letter-spacing: 8px;
              text-transform: uppercase;
              box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
            }
            .otp-label {
              font-size: 14px;
              opacity: 0.9;
              margin-bottom: 10px;
              text-transform: uppercase;
              letter-spacing: 2px;
            }
            .instructions {
              background-color: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 14px;
            }
            .security-note {
              background-color: #fff3cd;
              border: 1px solid #ffeaa7;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
              color: #856404;
            }
            .code-box {
              background: #f8f9fa;
              border: 2px dashed #dee2e6;
              padding: 20px;
              text-align: center;
              border-radius: 8px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">F</div>
              <h1>Flutter Learning Platform</h1>
              <h2>Email Verification</h2>
            </div>
            
            <p>Hello ${userName || 'there'},</p>
            
            <p>Thank you for registering with the Flutter Learning Platform! To complete your registration and access your account, please use the 6-digit verification code below.</p>
            
            <div class="instructions">
              <h3>📋 Verification Instructions:</h3>
              <ol>
                <li>Copy the 6-digit verification code</li>
                <li>Return to the verification page</li>
                <li>Enter the code to complete verification</li>
                <li>Access your learning dashboard</li>
              </ol>
            </div>
            
            <div class="otp-container">
              <div class="otp-label">Verification Code</div>
              ${verificationCode}
            </div>
            
            <div class="security-note">
              <strong>🔒 Security Notice:</strong><br>
              • This code expires in 10 minutes<br>
              • Never share this code with anyone<br>
              • Our team will never ask for this code
            </div>
            
            <div class="code-box">
              <strong>Having trouble?</strong><br>
              Copy and paste this code: <code>${verificationCode}</code>
            </div>
            
            <p style="text-align: center;">
              <strong>If you didn't create an account with us, please ignore this email.</strong>
            </p>
            
            <div class="footer">
              <p>Best regards,<br>
              The Flutter Learning Platform Team</p>
              <p style="font-size: 12px; color: #999;">
                This is an automated message. Please do not reply to this email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('📧 Verification email sent successfully!');
    console.log('📧 To:', email);
    console.log('📧 Subject: Email Verification');
    console.log('🔢 OTP Code:', verificationCode);
    
    // In development with ethereal, show preview URL
    if (process.env.NODE_ENV === 'development' && info.messageId) {
      console.log('📧 Preview URL (development):', nodemailer.getTestMessageUrl(info));
    }
    
    return {
      success: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info)
    };
    
  } catch (error) {
    console.error('❌ Failed to send verification email:', error);
    
    // Fallback: show OTP in console for development
    console.log('🔍 FALLBACK - 6-digit OTP for development:', verificationCode);
    
    return {
      success: false,
      error: error.message,
      fallbackCode: verificationCode
    };
  }
};

module.exports = {
  sendVerificationEmail
};
