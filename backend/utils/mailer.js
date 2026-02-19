const nodemailer = require('nodemailer');
const path = require('path');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send certificate email
const sendCertificateEmail = async (recipientEmail, studentName, certificatePath) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email credentials not configured, skipping email send');
      return;
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `"Flutter Learning Platform" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: '🎉 Congratulations! Your Flutter Course Certificate is Ready',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; color: white; margin-bottom: 30px;">
            <h1 style="margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">You've completed the Flutter Course!</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #333; margin-top: 0;">Dear ${studentName},</h2>
            <p style="color: #555; line-height: 1.6; font-size: 16px;">
              We are thrilled to inform you that you have successfully completed the comprehensive 
              <strong>6-Month Flutter Mobile App Development Course</strong>!
            </p>
            <p style="color: #555; line-height: 1.6; font-size: 16px;">
              Your dedication and hard work throughout the three phases of learning have been exceptional:
            </p>
            <ul style="color: #555; line-height: 1.8; font-size: 15px;">
              <li><strong>Phase 1 - Foundation:</strong> Mastered Dart basics and Flutter fundamentals</li>
              <li><strong>Phase 2 - Intermediate:</strong> Conquered state management and API integration</li>
              <li><strong>Phase 3 - Advanced:</strong> Excelled in animations, testing, and deployment</li>
            </ul>
          </div>
          
          <div style="background: #e8f5e8; border-left: 4px solid #28a745; padding: 20px; margin-bottom: 25px;">
            <h3 style="color: #155724; margin-top: 0;">📜 Your Certificate</h3>
            <p style="color: #155724; margin-bottom: 0;">
              Your official certificate of completion is attached to this email. You can also download it 
              from your student dashboard at any time.
            </p>
          </div>
          
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin-bottom: 25px;">
            <h3 style="color: #856404; margin-top: 0;">🚀 What's Next?</h3>
            <p style="color: #856404; margin-bottom: 10px;">Now that you've mastered Flutter, consider:</p>
            <ul style="color: #856404; line-height: 1.6;">
              <li>Building and publishing your own apps</li>
              <li>Contributing to open-source Flutter projects</li>
              <li>Exploring advanced topics like custom plugins</li>
              <li>Sharing your knowledge with the Flutter community</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #666; font-size: 16px;">
              Thank you for being part of our Flutter learning community!
            </p>
            <p style="color: #333; font-weight: bold; font-size: 18px;">
              Happy Coding! 💙
            </p>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #888; font-size: 14px;">
            <p>Flutter Learning Platform Team</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `Flutter_Certificate_${studentName.replace(/\s+/g, '_')}.pdf`,
          path: certificatePath
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Certificate email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Send certificate email error:', error);
    throw error;
  }
};

// Send welcome email to new students
const sendWelcomeEmail = async (recipientEmail, studentName) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email credentials not configured, skipping welcome email');
      return;
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `"Flutter Learning Platform" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: '🚀 Welcome to Flutter Learning Platform!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; color: white; margin-bottom: 30px;">
            <h1 style="margin: 0; font-size: 28px;">🚀 Welcome to Flutter!</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Your coding journey starts here</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #333; margin-top: 0;">Hello ${studentName}!</h2>
            <p style="color: #555; line-height: 1.6; font-size: 16px;">
              Welcome to the <strong>6-Month Flutter Mobile App Development Course</strong>! 
              We're excited to have you join our learning community.
            </p>
          </div>
          
          <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 20px; margin-bottom: 25px;">
            <h3 style="color: #1565c0; margin-top: 0;">📚 Course Overview</h3>
            <p style="color: #1565c0; margin-bottom: 10px;">Your 26-week journey includes:</p>
            <ul style="color: #1565c0; line-height: 1.6;">
              <li><strong>Weeks 1-8:</strong> Foundation - Dart & Flutter basics</li>
              <li><strong>Weeks 9-16:</strong> Intermediate - State management & APIs</li>
              <li><strong>Weeks 17-26:</strong> Advanced - Animations, testing & deployment</li>
            </ul>
          </div>
          
          <div style="background: #f3e5f5; border-left: 4px solid #9c27b0; padding: 20px; margin-bottom: 25px;">
            <h3 style="color: #7b1fa2; margin-top: 0;">🎯 Getting Started</h3>
            <ol style="color: #7b1fa2; line-height: 1.6;">
              <li>Log in to your student dashboard</li>
              <li>Complete your profile setup</li>
              <li>Start with Week 1: Flutter setup & Dart basics</li>
              <li>Watch videos and submit assignments on time</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #666; font-size: 16px;">
              Ready to build amazing mobile apps? Let's get started!
            </p>
            <p style="color: #333; font-weight: bold; font-size: 18px;">
              Happy Learning! 💙
            </p>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #888; font-size: 14px;">
            <p>Flutter Learning Platform Team</p>
            <p>Need help? Contact us through your student dashboard.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Send welcome email error:', error);
    // Don't throw error for welcome email failures
  }
};

module.exports = {
  sendCertificateEmail,
  sendWelcomeEmail
};