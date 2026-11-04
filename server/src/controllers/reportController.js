import mongoose from "mongoose";
import PDFDocument from "pdfkit";

import Scan from "../models/Scan.js";
import Finding from "../models/Finding.js";

const severityColors = {
  critical: "#991B1B",
  high: "#DC2626",
  medium: "#D97706",
  low: "#2563EB",
  info: "#64748B",
};

const formatDate = (date) => {
  if (!date) return "N/A";

  return new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatDuration = (duration) => {
  if (duration == null) return "N/A";
  if (duration < 1000) return `${duration} ms`;

  return `${(duration / 1000).toFixed(2)} seconds`;
};





export const generateScanReport = async (req, res) => {
  try {
    const { id } = req.params;

    
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid scan ID.",
      });
    }

    
    const scan = await Scan.findOne({
      _id: id,
      user: req.user._id,
    }).select("-__v");

    if (!scan) {
      return res.status(404).json({
        message: "Scan not found.",
      });
    }

    
    if (scan.status !== "completed") {
      return res.status(400).json({
        message: "Reports can only be generated for completed scans.",
      });
    }

    
    const findings = await Finding.find({
      scan: scan._id,
      user: req.user._id,
    })
      .sort({ severity: 1, startLine: 1 })
      .select("-__v");

    
    const severityCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };

    const statusCounts = {
      open: 0,
      fixed: 0,
      ignored: 0,
    };

    findings.forEach((finding) => {
      if (severityCounts[finding.severity] !== undefined) {
        severityCounts[finding.severity]++;
      }

      if (statusCounts[finding.status] !== undefined) {
        statusCounts[finding.status]++;
      }
    });

    
    const safeName =
      (scan.name || "security-scan")
        .replace(/[^a-z0-9-_ ]/gi, "")
        .trim()
        .replace(/\s+/g, "-")
        .slice(0, 60) || "security-scan";

    const filename = `${safeName}-report.pdf`;

    
    res.setHeader("Content-Type", "application/pdf");

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );

    
    const doc = new PDFDocument({
      size: "A4",
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50,
      },
      bufferPages: true,
      info: {
        Title: `Security Report - ${scan.name}`,
        Author: "SecureCode AI",
        Subject: "Static Code Security Analysis",
      },
    });

    doc.on("error", (error) => {
      console.error("PDF generation error:", error);

      if (!res.headersSent) {
        res.status(500).end();
      } else {
        res.destroy(error);
      }
    });

    doc.pipe(res);

    const pageWidth =
      doc.page.width -
      doc.page.margins.left -
      doc.page.margins.right;

    
    
    

    doc
      .font("Helvetica-Bold")
      .fontSize(25)
      .fillColor("#4648D4")
      .text("SecureCode AI");

    doc
      .moveDown(0.3)
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#64748B")
      .text("Code Security Analysis Report");

    doc.moveDown(1);

    doc
      .strokeColor("#E2E8F0")
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(50 + pageWidth, doc.y)
      .stroke();

    doc.moveDown(1);

    
    
    

    doc
      .font("Helvetica-Bold")
      .fontSize(17)
      .fillColor("#1E293B")
      .text("Scan Information");

    doc.moveDown(0.7);

    const scanInformation = [
      ["Scan Name", scan.name || "Untitled Scan"],
      ["Scan ID", scan._id.toString()],
      ["Programming Language", scan.language],
      ["Source Type", scan.sourceType],
      ["Scan Status", scan.status],
      ["Created At", formatDate(scan.createdAt)],
      ["Completed At", formatDate(scan.completedAt)],
      ["Duration", formatDuration(scan.duration)],
    ];

    scanInformation.forEach(([label, value]) => {
      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor("#475569")
        .text(`${label}: `, {
          continued: true,
        });

      doc
        .font("Helvetica")
        .fillColor("#1E293B")
        .text(String(value));
    });

    doc.moveDown(1.5);

    
    
    

    doc
      .font("Helvetica-Bold")
      .fontSize(17)
      .fillColor("#1E293B")
      .text("Executive Summary");

    doc.moveDown(0.7);

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#475569")
      .text(
        `The security analysis identified ${findings.length} finding(s) in the submitted source code. The following section provides a breakdown by severity and finding status.`
      );

    doc.moveDown(1);

    
    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor("#4648D4")
      .text(`Total Findings: ${findings.length}`);

    doc.moveDown(0.8);

    
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("#1E293B")
      .text("Severity Breakdown");

    doc.moveDown(0.5);

    Object.entries(severityCounts).forEach(([severity, count]) => {
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor(severityColors[severity])
        .text(`${severity.toUpperCase()}: ${count}`, {
          continued: true,
        });

      doc
        .font("Helvetica")
        .fillColor("#64748B")
        .text(
          `  (${findings.length
            ? Math.round((count / findings.length) * 100)
            : 0}%)`
        );
    });

    doc.moveDown(1);

    
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("#1E293B")
      .text("Finding Status");

    doc.moveDown(0.5);

    Object.entries(statusCounts).forEach(([status, count]) => {
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#475569")
        .text(`${status.toUpperCase()}: ${count}`);
    });

    doc.moveDown(1.5);

    
    
    

    doc.addPage();

    doc
      .font("Helvetica-Bold")
      .fontSize(19)
      .fillColor("#1E293B")
      .text("Detailed Findings");

    doc.moveDown(1);

    if (findings.length === 0) {
      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor("#16A34A")
        .text("No vulnerabilities were detected in this scan.");
    }

    findings.forEach((finding, index) => {
      
      if (doc.y > doc.page.height - 200) {
        doc.addPage();
      }

      const severityColor =
        severityColors[finding.severity] || "#64748B";

      
      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor(severityColor)
        .text(
          `${index + 1}. ${finding.severity.toUpperCase()}`
        );

      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#1E293B")
        .text(finding.title || "Untitled Finding");

      doc.moveDown(0.4);

      
      const metadata = [
        ["Rule ID", finding.ruleId],
        ["Category", finding.category],
        ["File", finding.filePath],
        [
          "Location",
          `Line ${finding.startLine}${
            finding.endLine
              ? ` - ${finding.endLine}`
              : ""
          }`,
        ],
        ["Status", finding.status],
        [
          "CWE",
          Array.isArray(finding.cwe)
            ? finding.cwe.join(", ") || "N/A"
            : "N/A",
        ],
        ["OWASP", finding.owasp || "N/A"],
      ];

      metadata.forEach(([label, value]) => {
        if (!value) return;

        doc
          .font("Helvetica-Bold")
          .fontSize(9)
          .fillColor("#475569")
          .text(`${label}: `, {
            continued: true,
          });

        doc
          .font("Helvetica")
          .fillColor("#475569")
          .text(String(value));
      });

      doc.moveDown(0.5);

      
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#1E293B")
        .text("Description");

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#475569")
        .text(finding.description || "No description available.", {
          width: pageWidth,
        });

      doc.moveDown(0.6);

      
      if (finding.aiExplanation) {
        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .fillColor("#4648D4")
          .text("AI Explanation");

        doc
          .font("Helvetica")
          .fontSize(9)
          .fillColor("#475569")
          .text(finding.aiExplanation, {
            width: pageWidth,
          });

        doc.moveDown(0.6);
      }

      
      if (finding.aiImpact) {
        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .fillColor("#1E293B")
          .text("Potential Impact");

        doc
          .font("Helvetica")
          .fontSize(9)
          .fillColor("#475569")
          .text(finding.aiImpact, {
            width: pageWidth,
          });

        doc.moveDown(0.6);
      }

      
      if (finding.recommendation) {
        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .fillColor("#1E293B")
          .text("Remediation Recommendation");

        doc
          .font("Helvetica")
          .fontSize(9)
          .fillColor("#475569")
          .text(finding.recommendation, {
            width: pageWidth,
          });

        doc.moveDown(0.6);
      }

      
      if (finding.suggestedFix) {
        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .fillColor("#16A34A")
          .text("AI Suggested Fix");

        doc
          .font("Courier")
          .fontSize(8)
          .fillColor("#334155")
          .text(finding.suggestedFix, {
            width: pageWidth,
            lineGap: 2,
          });

        doc.moveDown(0.6);
      }

      
      if (finding.codeSnippet) {
        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .fillColor("#1E293B")
          .text("Affected Code");

        doc
          .font("Courier")
          .fontSize(8)
          .fillColor("#64748B")
          .text(finding.codeSnippet, {
            width: pageWidth,
            lineGap: 2,
          });

        doc.moveDown(0.6);
      }

      
      doc
        .strokeColor("#E2E8F0")
        .lineWidth(0.7)
        .moveTo(50, doc.y + 4)
        .lineTo(50 + pageWidth, doc.y + 4)
        .stroke();

      doc.moveDown(1.2);
    });

    
    
    

    if (doc.y > doc.page.height - 120) {
      doc.addPage();
    }

    doc.moveDown(1);

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#1E293B")
      .text("Important Disclaimer");

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#64748B")
      .text(
        "This report is generated from static code analysis and AI-assisted recommendations. AI-generated fixes are suggestions and have not been independently verified. Developers should review and test all suggested changes before applying them. A scan does not guarantee that the source code is free from security vulnerabilities."
      );

    
    
    

    const pageRange = doc.bufferedPageRange();

    for (
      let pageIndex = pageRange.start;
      pageIndex < pageRange.start + pageRange.count;
      pageIndex++
    ) {
      doc.switchToPage(pageIndex);

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#94A3B8")
        .text(
          `SecureCode AI | Confidential Security Report | Page ${pageIndex + 1}`,
          50,
          doc.page.height - 35,
          {
            width: pageWidth,
            align: "center",
          }
        );
    }

    doc.end();
  } catch (error) {
    console.error("Generate scan report error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        message: "Unable to generate security report.",
      });
    }

    res.destroy(error);
  }
};
