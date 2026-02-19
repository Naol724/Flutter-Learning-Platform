const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

const generateCertificate = async ({ studentName, certificateId, completionDate, totalPoints, completionPercentage }) => {
  try {
    // Ensure certificates directory exists
    const certificatesDir = path.join(__dirname, '..', 'certificates');
    if (!fs.existsSync(certificatesDir)) {
      fs.mkdirSync(certificatesDir, { recursive: true });
    }

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([792, 612]); // Letter size landscape

    // Get fonts
    const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const nameFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const { width, height } = page.getSize();

    // Colors
    const primaryColor = rgb(0.2, 0.4, 0.8); // Blue
    const secondaryColor = rgb(0.3, 0.3, 0.3); // Dark gray
    const accentColor = rgb(0.8, 0.6, 0.2); // Gold

    // Draw border
    page.drawRectangle({
      x: 30,
      y: 30,
      width: width - 60,
      height: height - 60,
      borderColor: primaryColor,
      borderWidth: 3,
    });

    page.drawRectangle({
      x: 40,
      y: 40,
      width: width - 80,
      height: height - 80,
      borderColor: accentColor,
      borderWidth: 1,
    });

    // Title
    page.drawText('CERTIFICATE OF COMPLETION', {
      x: width / 2 - 200,
      y: height - 120,
      size: 32,
      font: titleFont,
      color: primaryColor,
    });

    // Subtitle
    page.drawText('Flutter Mobile App Development Course', {
      x: width / 2 - 150,
      y: height - 160,
      size: 20,
      font: bodyFont,
      color: secondaryColor,
    });

    // "This is to certify that" text
    page.drawText('This is to certify that', {
      x: width / 2 - 80,
      y: height - 220,
      size: 16,
      font: bodyFont,
      color: secondaryColor,
    });

    // Student name (larger, bold)
    page.drawText(studentName, {
      x: width / 2 - (studentName.length * 8),
      y: height - 260,
      size: 28,
      font: nameFont,
      color: primaryColor,
    });

    // Completion text
    page.drawText('has successfully completed the comprehensive 6-month', {
      x: width / 2 - 180,
      y: height - 300,
      size: 14,
      font: bodyFont,
      color: secondaryColor,
    });

    page.drawText('Flutter Mobile App Development Course', {
      x: width / 2 - 130,
      y: height - 320,
      size: 16,
      font: titleFont,
      color: primaryColor,
    });

    page.drawText('covering Foundation, Intermediate, and Advanced phases', {
      x: width / 2 - 160,
      y: height - 340,
      size: 14,
      font: bodyFont,
      color: secondaryColor,
    });

    // Course details
    const courseDetails = [
      '• Phase 1: Foundation (Weeks 1-8) - Dart basics, Flutter widgets, layouts',
      '• Phase 2: Intermediate (Weeks 9-16) - State management, APIs, databases',
      '• Phase 3: Advanced (Weeks 17-26) - Animations, testing, deployment'
    ];

    let yPosition = height - 380;
    courseDetails.forEach(detail => {
      page.drawText(detail, {
        x: 80,
        y: yPosition,
        size: 11,
        font: bodyFont,
        color: secondaryColor,
      });
      yPosition -= 20;
    });

    // Achievement stats
    page.drawText(`Total Points Earned: ${totalPoints}`, {
      x: 80,
      y: yPosition - 20,
      size: 12,
      font: bodyFont,
      color: accentColor,
    });

    page.drawText(`Course Completion: ${Math.round(completionPercentage)}%`, {
      x: 300,
      y: yPosition - 20,
      size: 12,
      font: bodyFont,
      color: accentColor,
    });

    // Date and certificate ID
    const formattedDate = completionDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    page.drawText(`Date of Completion: ${formattedDate}`, {
      x: 80,
      y: 120,
      size: 12,
      font: bodyFont,
      color: secondaryColor,
    });

    page.drawText(`Certificate ID: ${certificateId}`, {
      x: 80,
      y: 100,
      size: 10,
      font: bodyFont,
      color: secondaryColor,
    });

    // Signature area
    page.drawText('Flutter Learning Platform', {
      x: width - 250,
      y: 140,
      size: 14,
      font: titleFont,
      color: primaryColor,
    });

    page.drawText('Course Administrator', {
      x: width - 230,
      y: 120,
      size: 12,
      font: bodyFont,
      color: secondaryColor,
    });

    // Draw signature line
    page.drawLine({
      start: { x: width - 250, y: 110 },
      end: { x: width - 80, y: 110 },
      thickness: 1,
      color: secondaryColor,
    });

    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    const fileName = `certificate_${certificateId}.pdf`;
    const filePath = path.join(certificatesDir, fileName);
    
    fs.writeFileSync(filePath, pdfBytes);

    return filePath;
  } catch (error) {
    console.error('Certificate generation error:', error);
    throw new Error('Failed to generate certificate');
  }
};

module.exports = {
  generateCertificate
};