import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface CertificateData {
  studentName: string;
  courseName: string;
  date: string;
  certificateId: string;
  creatorName: string;
}

export async function generateCertificate(templateUrl: string, data: CertificateData): Promise<Uint8Array> {
  try {
    const existingPdfBytes = await fetch(templateUrl).then((res) => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    // Use Helvetica Bold for headings
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Helper to center text
    const drawCenteredText = (text: string, y: number, fontSize: number, fontRef: any, color = rgb(0, 0, 0)) => {
      const textWidth = fontRef.widthOfTextAtSize(text, fontSize);
      firstPage.drawText(text, {
        x: width / 2 - textWidth / 2,
        y,
        size: fontSize,
        font: fontRef,
        color,
      });
    };

    // Draw Dynamic Fields (Approximate positions for standard certificate templates)
    // 1. Student Name (Main highlight)
    drawCenteredText(data.studentName, height * 0.55, 36, font, rgb(0.05, 0.35, 0.26)); // Dark Green (#0E5B44)

    // 2. Course Name
    drawCenteredText(`for successfully completing the course`, height * 0.48, 14, regularFont, rgb(0.4, 0.4, 0.4));
    drawCenteredText(data.courseName, height * 0.42, 24, font, rgb(0, 0, 0));
    
    // 3. Date and ID (Bottom left)
    firstPage.drawText(`Date: ${data.date}`, { 
      x: 70, 
      y: 100, 
      size: 12, 
      font: regularFont 
    });
    firstPage.drawText(`Certificate ID: ${data.certificateId}`, { 
      x: 70, 
      y: 80, 
      size: 10, 
      font: regularFont, 
      color: rgb(0.5, 0.5, 0.5) 
    });
    
    // 4. Instructor Signature Area (Bottom right)
    const signatureLabel = "Instructor";
    const instructorName = data.creatorName;
    const sigWidth = font.widthOfTextAtSize(instructorName, 14);
    
    firstPage.drawText(signatureLabel, { 
      x: width - 70 - font.widthOfTextAtSize(signatureLabel, 10), 
      y: 120, 
      size: 10, 
      font: regularFont,
      color: rgb(0.4, 0.4, 0.4)
    });
    
    firstPage.drawText(instructorName, { 
      x: width - 70 - sigWidth, 
      y: 100, 
      size: 14, 
      font: font,
      color: rgb(0, 0, 0)
    });

    // Draw a subtle line for signature
    firstPage.drawLine({
      start: { x: width - 200, y: 115 },
      end: { x: width - 70, y: 115 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    return await pdfDoc.save();
  } catch (error) {
    console.error('Error generating certificate:', error);
    throw error;
  }
}
