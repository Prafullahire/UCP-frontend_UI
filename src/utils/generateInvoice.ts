import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Order, Shipment } from '../features/orders/types';

export const generateInvoicePDF = (orders: any[]) => {
  const doc = new jsPDF();
  
  orders.forEach((order, index) => {
    if (index > 0) doc.addPage();

  
  // Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("TAX INVOICE", 105, 15, { align: "center" });

  // Section 1: Order Information (Grey background)
  doc.setFillColor(230, 230, 230);
  doc.rect(14, 20, 182, 8, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Order Information", 16, 25);

  doc.setFont("helvetica", "normal");
  doc.text(`Order Reference: ${order.id || 'N/A'}`, 16, 35);
  doc.text(`AWB Number: ${order.awb || 'N/A'}`, 16, 42);
  
  const invoiceNum = `INV-${Math.floor(100000000 + Math.random() * 900000000)}`;
  doc.text(`Invoice Number: ${invoiceNum}`, 105, 35);
  doc.text(`Invoice Date: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`, 105, 42);

  // Sold By / Billed To
  doc.setFont("helvetica", "bold");
  doc.text("Sold By:", 16, 52);
  doc.text("Billed To:", 105, 52);

  doc.setFont("helvetica", "normal");
  doc.text(`Xpressbees demo.`, 16, 58);
  doc.text(`${order.pickup?.city || 'Pune'}, ${order.pickup?.pin || '411001'}`, 16, 64);

  const customerName = order.customer?.name || 'N/A';
  doc.text(`${customerName}`, 105, 58);
  doc.text(`${customerName}, ${order.delivery?.city || 'Pune'}, ${order.delivery?.pin || '411019'}`, 105, 64);

  // Parse weight/dims
  let weightGram = 500;
  let len = 10, bre = 10, hei = 10;
  if (order.package) {
    const wtMatch = order.package.deadWt?.match(/(\d+(\.\d+)?)/);
    if (wtMatch) weightGram = parseFloat(wtMatch[1]) * 1000;
    
    const dimsMatch = order.package.dims?.match(/(\d+)x(\d+)x(\d+)/i) || order.package.dims?.match(/(\d+)×(\d+)×(\d+)/i);
    if (dimsMatch) {
      len = parseInt(dimsMatch[1]);
      bre = parseInt(dimsMatch[2]);
      hei = parseInt(dimsMatch[3]);
    }
  }

  // Product Table
  autoTable(doc, {
    startY: 75,
    head: [['Product Description', 'Product\nSKU', 'HSN\nCode', 'Quantity', 'Product\nAmount', 'Total']],
    body: [
      [
        order.product?.name || 'N/A',
        order.product?.sku || '',
        order.product?.hsn || '',
        order.product?.qty?.toString() || '1',
        order.payment?.amount?.toString() || '0',
        order.payment?.amount?.toString() || '0'
      ]
    ],
    theme: 'grid',
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3, halign: 'center' },
    columnStyles: { 0: { halign: 'left' } }
  });

  // Dimensions Table
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 10,
    head: [['Weight (gram)', 'Length (cm)', 'Breadth (cm)', 'Height (cm)']],
    body: [
      [weightGram.toString(), len.toString(), bre.toString(), hei.toString()]
    ],
    theme: 'grid',
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3, halign: 'center' }
  });

  // Shipping Charges Table
  // Header with grey background
  doc.setFillColor(230, 230, 230);
  doc.rect(14, (doc as any).lastAutoTable.finalY + 8, 182, 8, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Shipping Charges", 16, (doc as any).lastAutoTable.finalY + 13);

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 16,
    head: [['HSN Code', 'Base Amount', 'CGST @9%', 'SGST @9%', 'UTGST @0%', 'Net Payable']],
    body: [
      ['996812', '0', '0', '0', '0', '0']
    ],
    theme: 'grid',
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3, halign: 'center' }
  });

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("This is a computer-generated invoice. No signature is required.", 105, (doc as any).lastAutoTable.finalY + 10, { align: "center" });

  });

  const fileName = orders.length === 1 ? `invoice_${orders[0].id}.pdf` : `invoices_bulk_${Date.now()}.pdf`;
  doc.save(fileName);
  return true;
};
