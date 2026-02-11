/* eslint-disable @typescript-eslint/no-explicit-any */
// src/utils/pdfExport.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { UseCaseDetail } from '../components/api';

interface ExportData {
  projectName: string;
  stories: string;
  actors: { name: string; aliases: string[] }[];
  scenarios: UseCaseDetail[];
  diagramImage: string | null; // Base64 image from GoJS
}

export const generateProjectPDF = (data: ExportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let yPos = 20;

  // Helper to check for page breaks
  const checkPageBreak = (neededHeight: number) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (yPos + neededHeight > pageHeight - margin) {
      doc.addPage();
      yPos = 20;
    }
  };

  // 1. Title Page
  doc.setFontSize(22);
  doc.text('System Requirements Specification', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;
  doc.setFontSize(16);
  doc.text(data.projectName, pageWidth / 2, yPos, { align: 'center' });
  yPos += 20;
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 15;

  // 2. User Stories
  doc.setFontSize(14);
  doc.text('1. User Stories', margin, yPos);
  yPos += 8;
  doc.setFontSize(10);
  const splitStories = doc.splitTextToSize(data.stories || 'No input.', pageWidth - margin * 2);
  doc.text(splitStories, margin, yPos);
  yPos += splitStories.length * 5 + 15;

  // 3. Actors Table
  doc.setFontSize(14);
  doc.text('2. Actors', margin, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [['Actor', 'Aliases']],
    body: data.actors.map((a) => [a.name, a.aliases.join(', ')]),
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
  });
  yPos = (doc as any).lastAutoTable.finalY + 15;

  // 4. Diagram
  checkPageBreak(100);
  doc.setFontSize(14);
  doc.text('3. Use Case Diagram', margin, yPos);
  yPos += 10;

  if (data.diagramImage) {
    const imgProps = doc.getImageProperties(data.diagramImage);
    const imgHeight = Math.min((imgProps.height * (pageWidth - margin * 2)) / imgProps.width, 140);
    doc.addImage(data.diagramImage, 'JPEG', margin, yPos, pageWidth - margin * 2, imgHeight);
    yPos += imgHeight + 15;
  }

  // 5. Scenarios (Detailed Tables)
  doc.addPage();
  yPos = 20;
  doc.setFontSize(14);
  doc.text('4. Use Case Specifications', margin, yPos);
  yPos += 10;

  data.scenarios.forEach((s, i) => {
    checkPageBreak(60);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`4.${i + 1} ${s.name}`, margin, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      body: [
        ['Description', s.description],
        ['Actors', s.actors],
        ['Pre-conditions', s.preconditions],
        ['Post-conditions', s.postconditions],
        ['Main Flow', s.mainFlow],
        ['Alternative Flow', s.alternativeFlow],
      ],
      theme: 'grid',
      columnStyles: { 0: { cellWidth: 35, fontStyle: 'bold', fillColor: [240, 240, 240] } },
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;
  });

  doc.save(`${data.projectName.replace(/\s+/g, '_')}_Report.pdf`);
};
