/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RaceStatistics } from '../types/race';
import { formatTimeMs } from '../utils/raceCalculations';

export interface CertificateOptions {
  raceId?: string;
  hostName?: string;
  customTitle?: string;
}

/**
 * Sanitizes strings for safe cross-platform file naming
 */
function sanitizeFileName(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Ensures ASCII safety for standard PDF fonts (prevents corrupted characters)
 */
function safeAscii(str: string | null | undefined): string {
  if (!str) return '';
  return String(str)
    .replace(/[→➔➜➝➞➡]/g, '->')
    .replace(/[•●·]/g, '|')
    .replace(/[★☆✦]/g, '*')
    .replace(/[—–]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’`]/g, "'")
    .replace(/[^\x20-\x7E\t\n\r]/g, ''); // Strip any unprintable non-ASCII glyphs
}

/**
 * Generates and downloads the official race certificate / result document as a PDF.
 */
export async function downloadRaceCertificatePdf(
  stats: RaceStatistics,
  options: CertificateOptions = {}
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 182mm

  // Colors
  const darkNavy = '#0f172a'; // slate-900
  const cyanPrimary = '#0891b2'; // cyan-600
  const emeraldGreen = '#059669'; // emerald-600
  const amberOrange = '#d97706'; // amber-600

  let currentY = 14;

  // -------------------------------------------------------------
  // 1. TOP HEADER BANNER (Slate-900 Header Block)
  // -------------------------------------------------------------
  const headerHeight = 24;
  doc.setFillColor(15, 23, 42); // #0f172a
  doc.roundedRect(marginX, currentY, contentWidth, headerHeight, 3, 3, 'F');

  // Brand Name & Subtitle
  doc.setTextColor(34, 211, 238); // #22d3ee (cyan-400)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('RUNNER STOPWATCH', marginX + 6, currentY + 9);

  doc.setTextColor(203, 213, 225); // #cbd5e1 (slate-300)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('OFFICIAL TIMING & MULTI-CHECKPOINT SYSTEM', marginX + 6, currentY + 16);

  // Right-side Certificate Badge
  const badgeWidth = 60;
  const badgeHeight = 12;
  const badgeX = marginX + contentWidth - badgeWidth - 6;
  const badgeY = currentY + 6;

  doc.setFillColor(6, 78, 59); // #064e3b (emerald-900)
  doc.setDrawColor(52, 211, 153); // #34d399 (emerald-400)
  doc.setLineWidth(0.5);
  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 2, 2, 'FD');

  doc.setTextColor(167, 243, 208); // #a7f3d0
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('OFFICIAL RESULT CERTIFICATE', badgeX + badgeWidth / 2, badgeY + 5, { align: 'center' });

  doc.setTextColor(209, 250, 229);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text('VERIFIED TIMING RECORD', badgeX + badgeWidth / 2, badgeY + 9.5, { align: 'center' });

  currentY += headerHeight + 5;

  // -------------------------------------------------------------
  // 2. EVENT & ATHLETE INFORMATION CARD
  // -------------------------------------------------------------
  const infoCardHeight = 22;
  doc.setFillColor(248, 250, 252); // #f8fafc
  doc.setDrawColor(226, 232, 240); // #e2e8f0
  doc.setLineWidth(0.4);
  doc.roundedRect(marginX, currentY, contentWidth, infoCardHeight, 2.5, 2.5, 'FD');

  // Event Name
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('EVENT / RACE NAME', marginX + 5, currentY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  const eventName = safeAscii(stats.raceName || 'Official Race Activity');
  doc.text(doc.splitTextToSize(eventName, 75)[0], marginX + 5, currentY + 14);

  // Athlete Name
  const col2X = marginX + 82;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('ATHLETE / RUNNER', col2X, currentY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(8, 145, 178); // cyan-600
  const runnerName = safeAscii(stats.runnerName || 'Participant');
  doc.text(doc.splitTextToSize(runnerName, 50)[0], col2X, currentY + 14);

  // Date & Status
  const col3X = marginX + 136;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('DATE & TIMING STATUS', col3X, currentY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  const dateFormatted = safeAscii(stats.dateFormatted || new Date().toLocaleDateString());
  doc.text(dateFormatted, col3X, currentY + 11.5);

  // Status Indicator: Vector Dot + Safe Text
  doc.setFillColor(5, 150, 105);
  doc.circle(col3X + 1.2, currentY + 16, 1.2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text('SYNCHRONIZED FINISH', col3X + 4.5, currentY + 17);

  currentY += infoCardHeight + 5;

  // -------------------------------------------------------------
  // 3. KEY METRICS 4-BOX GRID
  // -------------------------------------------------------------
  const cardGap = 3.5;
  const numCards = 4;
  const kpiWidth = (contentWidth - cardGap * (numCards - 1)) / numCards; // ~42.8mm each
  const kpiHeight = 22;

  const plannedDistKm = (stats.totalPlannedDistanceMeters / 1000).toFixed(2);
  const actualDistKm = stats.actualDistanceKm ? stats.actualDistanceKm.toFixed(2) : '0.00';

  const kpiData = [
    {
      label: 'OFFICIAL TIME',
      value: safeAscii(stats.totalTimeFormatted || '00:00.000'),
      sub: 'Cloud Synchronized',
      accentColor: cyanPrimary,
    },
    {
      label: 'TOTAL DISTANCE',
      value: `${actualDistKm} km`,
      sub: `Planned: ${plannedDistKm} km`,
      accentColor: darkNavy,
    },
    {
      label: 'AVERAGE PACE',
      value: safeAscii(stats.averagePaceFormatted || '--:--/km'),
      sub: 'Minutes / Kilometer',
      accentColor: amberOrange,
    },
    {
      label: 'AVERAGE SPEED',
      value: safeAscii(stats.averageSpeedFormatted || '--.-- km/h'),
      sub: 'Kilometers / Hour',
      accentColor: emeraldGreen,
    },
  ];

  kpiData.forEach((kpi, idx) => {
    const cardX = marginX + idx * (kpiWidth + cardGap);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.roundedRect(cardX, currentY, kpiWidth, kpiHeight, 2, 2, 'FD');

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, cardX + 4, currentY + 5.5);

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(kpi.value, cardX + 4, currentY + 12.5);

    // Subtext
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.sub, cardX + 4, currentY + 18);
  });

  currentY += kpiHeight + 5;

  // -------------------------------------------------------------
  // 4. COURSE EXECUTION / SPLIT PERFORMANCE HIGHLIGHTS
  // -------------------------------------------------------------
  const isSingleSegment =
    stats.processedCheckpoints.length <= 1 ||
    !stats.bestSplit ||
    !stats.slowestSplit ||
    (stats.bestSplit &&
      stats.slowestSplit &&
      stats.bestSplit.fromCheckpointName === stats.slowestSplit.fromCheckpointName &&
      stats.bestSplit.toCheckpointName === stats.slowestSplit.toCheckpointName);

  if (isSingleSegment) {
    // Single Measured Segment Card (Clean, Non-repetitive Layout)
    const singleCardHeight = 18;
    doc.setFillColor(240, 253, 250); // teal-50
    doc.setDrawColor(153, 246, 228); // teal-200
    doc.setLineWidth(0.4);
    doc.roundedRect(marginX, currentY, contentWidth, singleCardHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(13, 148, 136); // teal-600
    doc.text('MEASURED COURSE SEGMENT (ONLY MEASURED SEGMENT)', marginX + 5, currentY + 5);

    const segmentRef =
      stats.bestSplit ||
      (stats.processedCheckpoints[0]?.segment
        ? stats.processedCheckpoints[0].segment
        : null);

    const segName = segmentRef
      ? `${safeAscii(segmentRef.fromCheckpointName)} -> ${safeAscii(segmentRef.toCheckpointName)}`
      : 'START -> FINISH LINE';

    const segDist = segmentRef
      ? `${segmentRef.segmentDistanceKm.toFixed(2)} km`
      : `${actualDistKm} km`;

    const segTime = segmentRef ? safeAscii(formatTimeMs(segmentRef.segmentElapsedMs)) : safeAscii(stats.totalTimeFormatted || '--:--');
    const segPace = segmentRef ? safeAscii(segmentRef.segmentPaceFormatted) : safeAscii(stats.averagePaceFormatted || '--:--');
    const segSpeed = segmentRef ? safeAscii(segmentRef.segmentSpeedFormatted) : safeAscii(stats.averageSpeedFormatted || '--.-- km/h');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(segName, marginX + 5, currentY + 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(71, 85, 105);
    doc.text(`Segment Distance: ${segDist}   |   Execution Time: ${segTime}`, marginX + 5, currentY + 15);

    // Right Side: Pace & Speed
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(13, 148, 136);
    doc.text(`Pace: ${segPace}`, marginX + contentWidth - 5, currentY + 10, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(15, 118, 110);
    doc.text(`Speed: ${segSpeed}`, marginX + contentWidth - 5, currentY + 15, { align: 'right' });

    currentY += singleCardHeight + 5;
  } else {
    // Multi-Segment: Side-by-side Best & Slowest Split Cards
    const splitCardWidth = (contentWidth - 4) / 2;
    const splitCardHeight = 18;

    // Best Split Card
    if (stats.bestSplit) {
      const bestX = marginX;
      doc.setFillColor(236, 253, 245); // emerald-50
      doc.setDrawColor(167, 243, 208); // emerald-200
      doc.setLineWidth(0.4);
      doc.roundedRect(bestX, currentY, splitCardWidth, splitCardHeight, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(5, 150, 105); // emerald-600
      doc.text('BEST SPLIT SEGMENT', bestX + 4, currentY + 4.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      const bestSegmentName = `${safeAscii(stats.bestSplit.fromCheckpointName)} -> ${safeAscii(stats.bestSplit.toCheckpointName)}`;
      doc.text(doc.splitTextToSize(bestSegmentName, splitCardWidth - 28)[0], bestX + 4, currentY + 9.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(71, 85, 105);
      doc.text(
        `Dist: ${stats.bestSplit.segmentDistanceKm.toFixed(2)} km  |  Time: ${safeAscii(formatTimeMs(stats.bestSplit.segmentElapsedMs))}`,
        bestX + 4,
        currentY + 14.5
      );

      // Best Pace & Speed Badge
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(5, 150, 105);
      doc.text(safeAscii(stats.bestSplit.segmentPaceFormatted), bestX + splitCardWidth - 4, currentY + 9.5, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(16, 185, 129);
      doc.text(safeAscii(stats.bestSplit.segmentSpeedFormatted), bestX + splitCardWidth - 4, currentY + 14.5, { align: 'right' });
    }

    // Slowest Split Card
    if (stats.slowestSplit) {
      const slowX = marginX + splitCardWidth + 4;
      doc.setFillColor(254, 242, 242); // rose-50
      doc.setDrawColor(254, 202, 202); // rose-200
      doc.setLineWidth(0.4);
      doc.roundedRect(slowX, currentY, splitCardWidth, splitCardHeight, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(225, 29, 72); // rose-600
      doc.text('SLOWEST SPLIT SEGMENT', slowX + 4, currentY + 4.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      const slowSegmentName = `${safeAscii(stats.slowestSplit.fromCheckpointName)} -> ${safeAscii(stats.slowestSplit.toCheckpointName)}`;
      doc.text(doc.splitTextToSize(slowSegmentName, splitCardWidth - 28)[0], slowX + 4, currentY + 9.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(71, 85, 105);
      doc.text(
        `Dist: ${stats.slowestSplit.segmentDistanceKm.toFixed(2)} km  |  Time: ${safeAscii(formatTimeMs(stats.slowestSplit.segmentElapsedMs))}`,
        slowX + 4,
        currentY + 14.5
      );

      // Slowest Pace & Speed Badge
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(225, 29, 72);
      doc.text(safeAscii(stats.slowestSplit.segmentPaceFormatted), slowX + splitCardWidth - 4, currentY + 9.5, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(244, 63, 94);
      doc.text(safeAscii(stats.slowestSplit.segmentSpeedFormatted), slowX + splitCardWidth - 4, currentY + 14.5, { align: 'right' });
    }

    currentY += splitCardHeight + 5;
  }

  // -------------------------------------------------------------
  // 5. OFFICIAL CHECKPOINT SPLIT BREAKDOWN TABLE
  // -------------------------------------------------------------
  // Section Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('OFFICIAL CHECKPOINT SPLIT PROGRESSION', marginX, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Recorded Gates: ${stats.recordedCheckpointsCount}   |   Missed: ${stats.missedCheckpointsCount}   |   Total: ${stats.totalCheckpointsCount}`,
    marginX + contentWidth,
    currentY,
    { align: 'right' }
  );

  currentY += 2.5;

  // Prepare table headers
  const tableHeaders = [
    '#',
    'Checkpoint',
    'Distance',
    'Status',
    'Measured Segment',
    'Segment Dist',
    'Split Time',
    'Segment Pace',
    'Segment Speed',
    'Cumulative Time',
    'Cumulative Pace',
  ];

  const tableRows = stats.processedCheckpoints.map((row, idx) => {
    const order = String(idx + 1);
    const cpName = safeAscii(row.checkpoint?.name || (idx === stats.processedCheckpoints.length - 1 ? 'FINISH LINE' : `Checkpoint ${idx + 1}`));
    const dist = `${row.cumulativeDistanceKm ? row.cumulativeDistanceKm.toFixed(2) : '0.00'} km`;
    const statusText = safeAscii(row.status || 'RECORDED');
    const measuredSegment = row.segment
      ? `${safeAscii(row.segment.fromCheckpointName)} -> ${safeAscii(row.segment.toCheckpointName)}`
      : 'START -> FINISH LINE';
    const segDist = row.segment ? `${row.segment.segmentDistanceKm.toFixed(2)} km` : `${actualDistKm} km`;
    const splitTime = row.segment ? safeAscii(formatTimeMs(row.segment.segmentElapsedMs)) : safeAscii(stats.totalTimeFormatted || '--:--');
    const segPace = row.segment ? safeAscii(row.segment.segmentPaceFormatted) : safeAscii(stats.averagePaceFormatted || '--:--');
    const segSpeed = row.segment ? safeAscii(row.segment.segmentSpeedFormatted) : safeAscii(stats.averageSpeedFormatted || '--.-- km/h');
    const cumTime = safeAscii(row.cumulativeElapsedFormatted || stats.totalTimeFormatted || '--:--');
    const cumPace = safeAscii(row.cumulativePaceFormatted || stats.averagePaceFormatted || '--:--');

    return [
      order,
      cpName,
      dist,
      statusText,
      measuredSegment,
      segDist,
      splitTime,
      segPace,
      segSpeed,
      cumTime,
      cumPace,
    ];
  });

  // If no checkpoints were processed, provide a single row summary
  if (tableRows.length === 0) {
    tableRows.push([
      '1',
      'FINISH LINE',
      `${actualDistKm} km`,
      'RECORDED',
      'START -> FINISH LINE',
      `${actualDistKm} km`,
      safeAscii(stats.totalTimeFormatted || '00:00.000'),
      safeAscii(stats.averagePaceFormatted || '--:--'),
      safeAscii(stats.averageSpeedFormatted || '--.-- km/h'),
      safeAscii(stats.totalTimeFormatted || '00:00.000'),
      safeAscii(stats.averagePaceFormatted || '--:--'),
    ]);
  }

  // Exact column width distribution summing to 182mm (contentWidth):
  // 6 + 26 + 15 + 17 + 28 + 14 + 16 + 15 + 15 + 16 + 14 = 182mm
  autoTable(doc, {
    startY: currentY + 1.5,
    margin: { left: marginX, right: marginX, top: 18, bottom: 24 },
    head: [tableHeaders],
    body: tableRows,
    theme: 'grid',
    showHead: 'everyPage',
    styles: {
      font: 'helvetica',
      fontSize: 6.2,
      cellPadding: { top: 2, bottom: 2, left: 1, right: 1 },
      minCellHeight: 6,
      lineColor: [226, 232, 240], // #e2e8f0
      lineWidth: 0.2,
      textColor: [51, 65, 85], // #334155
      overflow: 'linebreak',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [15, 23, 42], // #0f172a
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 6.2,
      halign: 'left',
      cellPadding: { top: 2.2, bottom: 2.2, left: 1, right: 1 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // #f8fafc
    },
    columnStyles: {
      0: { cellWidth: 6, halign: 'center' }, // #
      1: { cellWidth: 26, fontStyle: 'bold' }, // Checkpoint
      2: { cellWidth: 15, halign: 'right' }, // Distance
      3: { cellWidth: 17, halign: 'center', fontStyle: 'bold' }, // Status
      4: { cellWidth: 28 }, // Measured Segment
      5: { cellWidth: 14, halign: 'right' }, // Segment Dist
      6: { cellWidth: 16, halign: 'right', fontStyle: 'bold', textColor: [8, 145, 178] }, // Split Time
      7: { cellWidth: 15, halign: 'right', fontStyle: 'bold', textColor: [180, 83, 9] }, // Segment Pace
      8: { cellWidth: 15, halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105] }, // Segment Speed
      9: { cellWidth: 16, halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42] }, // Cumulative Time
      10: { cellWidth: 14, halign: 'right' }, // Cumulative Pace
    },
    didParseCell: (data) => {
      // Highlight Status column
      if (data.section === 'body' && data.column.index === 3) {
        const val = String(data.cell.raw);
        if (val === 'RECORDED') {
          data.cell.styles.textColor = [5, 150, 105]; // emerald-600
        } else if (val === 'MISSED') {
          data.cell.styles.textColor = [217, 119, 6]; // amber-600
        }
      }

      // Highlight missed checkpoint rows
      if (data.section === 'body') {
        const statusVal = String(data.row.raw[3]);
        if (statusVal === 'MISSED') {
          data.cell.styles.fillColor = [255, 251, 235]; // amber-50
        }
      }
    },
  });

  // -------------------------------------------------------------
  // 6. DUAL-ROW ROBUST FOOTER ON ALL PAGES (ZERO OVERLAP)
  // -------------------------------------------------------------
  const totalPages = (doc.internal as any).getNumberOfPages();
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);

    // Subtle divider line above footer at Y = 281mm
    const dividerY = pageHeight - 16;
    doc.setDrawColor(226, 232, 240); // #e2e8f0
    doc.setLineWidth(0.3);
    doc.line(marginX, dividerY, marginX + contentWidth, dividerY);

    // ROW 1: System Title (Left), Certification (Center), Generation Time (Right) at Y = 286mm
    const row1Y = pageHeight - 11;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(100, 116, 139); // slate-500

    // Left: Official Synchronized Race Record
    doc.text('Official Synchronized Race Record', marginX, row1Y, { align: 'left' });

    // Center: Certified by Runner Stopwatch Timing Engine
    doc.text('Certified by Runner Stopwatch Timing Engine', marginX + contentWidth / 2, row1Y, {
      align: 'center',
    });

    // Right: Generated date/time
    doc.text(`Generated: ${dateStr}`, marginX + contentWidth, row1Y, { align: 'right' });

    // ROW 2: Website Brand (Left), Page Count (Right) at Y = 291mm
    const row2Y = pageHeight - 6;

    // Left: mohandagar.in
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(8, 145, 178); // cyan-600
    doc.text('mohandagar.in', marginX, row2Y, { align: 'left' });

    // Right: Page X of Y
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(51, 65, 85); // slate-700
    doc.text(`Page ${page} of ${totalPages}`, marginX + contentWidth, row2Y, {
      align: 'right',
    });
  }

  // -------------------------------------------------------------
  // 7. FILE DOWNLOAD
  // -------------------------------------------------------------
  const cleanRunner = sanitizeFileName(stats.runnerName || 'Runner');
  const cleanDate = sanitizeFileName(stats.dateFormatted || 'Result');
  const filename = `Runner-Stopwatch-Official-Result-${cleanRunner}-${cleanDate}.pdf`;

  doc.save(filename);
}
