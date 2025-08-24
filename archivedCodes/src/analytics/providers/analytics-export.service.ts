import { Injectable, Logger } from '@nestjs/common';
import { Response } from 'express';
import * as fastCsv from 'fast-csv';
import * as PDFDocument from 'pdfkit';
import { AnalyticsEvent } from '../entities/analytics-event.entity';
import { ExportFormat } from '../dto/export-analytics-query.dto';

@Injectable()
export class AnalyticsExportService {
  private readonly logger = new Logger(AnalyticsExportService.name);

  /**
   * Export analytics data in the specified format
   */
  async exportAnalytics(
    data: AnalyticsEvent[],
    format: ExportFormat,
    res: Response,
  ): Promise<void> {
    try {
      switch (format) {
        case ExportFormat.CSV:
          await this.exportToCsv(data, res);
          break;
        case ExportFormat.PDF:
          await this.exportToPdf(data, res);
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      this.logger.error(`Export failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Export analytics data to CSV format
   */
  private async exportToCsv(data: AnalyticsEvent[], res: Response): Promise<void> {
    const filename = `analytics-export-${new Date().toISOString().split('T')[0]}.csv`;
    
    // Set response headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');

    // Transform data for CSV export
    const csvData = data.map(event => ({
      id: event.id,
      eventType: event.eventType,
      userId: event.userId,
      timestamp: event.createdAt.toISOString(),
      metadata: JSON.stringify(event.metadata),
    }));

    // Write CSV to response
    fastCsv.write(csvData, { headers: true })
      .pipe(res);
  }

  /**
   * Export analytics data to PDF format
   */
  private async exportToPdf(data: AnalyticsEvent[], res: Response): Promise<void> {
    const filename = `analytics-export-${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Set response headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });

    // Pipe PDF to response
    doc.pipe(res);

    // Add header
    this.addPdfHeader(doc, data.length);

    // Add data table
    this.addPdfTable(doc, data);

    // Finalize PDF
    doc.end();
  }

  /**
   * Add header to PDF document
   */
  private addPdfHeader(doc: PDFKit.PDFDocument, recordCount: number): void {
    // Title
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .text('Analytics Export Report', { align: 'center' })
       .moveDown();

    // Export info
    doc.fontSize(12)
       .font('Helvetica')
       .text(`Generated on: ${new Date().toLocaleString()}`)
       .text(`Total records: ${recordCount}`)
       .moveDown(2);
  }

  /**
   * Add data table to PDF document
   */
  private addPdfTable(doc: PDFKit.PDFDocument, data: AnalyticsEvent[]): void {
    const tableTop = doc.y;
    const tableLeft = 50;
    const colWidth = 120;
    const rowHeight = 20;
    const fontSize = 8;

    // Table headers
    const headers = ['ID', 'Event Type', 'User ID', 'Timestamp', 'Metadata'];
    
    doc.fontSize(fontSize)
       .font('Helvetica-Bold');

    headers.forEach((header, index) => {
      doc.text(header, tableLeft + (index * colWidth), tableTop);
    });

    doc.moveDown();

    // Table data
    doc.font('Helvetica');
    let currentY = doc.y;

    data.forEach((event, index) => {
      // Check if we need a new page
      if (currentY > doc.page.height - 100) {
        doc.addPage();
        currentY = 50;
      }

      const rowData = [
        event.id.toString(),
        this.truncateText(event.eventType, 15),
        event.userId.toString(),
        event.createdAt.toLocaleDateString(),
        this.truncateText(JSON.stringify(event.metadata), 20),
      ];

      rowData.forEach((cell, cellIndex) => {
        doc.text(cell, tableLeft + (cellIndex * colWidth), currentY);
      });

      currentY += rowHeight;
    });
  }

  /**
   * Truncate text to fit in table cell
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Generate export filename with timestamp
   */
  generateFilename(format: ExportFormat): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `analytics-export-${timestamp}.${format}`;
  }
} 