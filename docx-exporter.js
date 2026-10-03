/**
 * Word Exporter (.docx) for 168 Hours Weekly Life & Time Planner
 * Generates comprehensive Word documents including:
 * 1. Document Title & Life Perspective Metrics
 * 2. Weekly Category Breakdown & Allocated Task Hours
 * 3. Detailed Day-by-Day Chronological Agenda (Saturday to Friday)
 * 4. Complete 7-Day x 24-Hour Visual Schedule Matrix Table
 * 5. Personal Reflection & Goal Editing Worksheet
 */

window.DocxExporter = {

  /**
   * Main function to export the weekly plan as a Word document.
   * @param {Object} state - Current application state { days, slots, legends, grid, age }
   */
  async exportToWord(state) {
    console.log("Generating comprehensive Word document for weekly 168h plan...", state);

    // Helper: Determine text color (black or white) based on background hex luminance
    const getContrastTextColor = (hexColor) => {
      if (!hexColor || hexColor === 'transparent') return '334155';
      const hex = hexColor.replace('#', '');
      if (hex.length !== 6) return 'FFFFFF';
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const luminance = (r * 299 + g * 587 + b * 114) / 1000;
      return luminance > 140 ? '0F172A' : 'FFFFFF';
    };

    // Try native docx packer if available
    if (window.docx && window.docx.Document && window.docx.Packer) {
      try {
        await this.generateNativeDocx(state, getContrastTextColor);
        return;
      } catch (err) {
        console.warn("Native docx packing failed, falling back to formatted Word HTML document format:", err);
      }
    }

    // Fallback: Word XML/HTML Document format
    this.generateWordHtmlDoc(state, getContrastTextColor);
  },

  /**
   * Native .docx binary generation using docx.js library
   */
  async generateNativeDocx(state, getContrastTextColor) {
    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } = window.docx;

    // Calculate legend stats
    const legendCounts = {};
    const legendTimeBlocks = {}; // Store chronological blocks per legend
    state.legends.forEach(l => {
      legendCounts[l.id] = 0;
      legendTimeBlocks[l.id] = [];
    });
    let unallocatedCount = 0;

    // Day-by-Day Agenda extraction
    const dailyAgendas = state.days.map((dayName, dayIndex) => {
      const items = [];
      state.slots.forEach((slotLabel, slotIndex) => {
        const key = `${dayIndex}_${slotIndex}`;
        const legendId = state.grid[key];
        const legend = state.legends.find(l => l.id === legendId);
        items.push({
          slotIndex,
          timeSlot: slotLabel,
          legendId: legendId || 'unallocated',
          legendName: legend ? legend.name : 'Unallocated Time',
          color: legend ? legend.color : '#64748b'
        });

        if (legendId && legendCounts[legendId] !== undefined) {
          legendCounts[legendId]++;
        } else {
          unallocatedCount++;
        }
      });
      return { dayName, dayIndex, items };
    });

    const age = state.userAge || 28;
    const weeksLived = Math.round(age * 52.1429);
    const weeksRemaining = Math.max(0, 4000 - weeksLived);

    // Build document children
    const docChildren = [
      // Document Title
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: "MY WEEKLY 168-HOUR TIME & TASK PLAN",
            bold: true,
            size: 32,
            color: "1E3A8A"
          })
        ]
      }),

      // Life Perspective Banner
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
        children: [
          new TextRun({
            text: `Human Life Perspective: ~4,000 Weeks (~76.9 Years) | Age: ${age} | Weeks Lived: ${weeksLived.toLocaleString()} | Weeks Remaining: ${weeksRemaining.toLocaleString()}`,
            italic: true,
            size: 20,
            color: "475569"
          })
        ]
      }),

      // Section 1: Summary Table
      new Paragraph({
        spacing: { before: 200, after: 120 },
        children: [
          new TextRun({ text: "1. Weekly Allocation & Task Summary (Total 168 Hours)", bold: true, size: 24, color: "0F172A" })
        ]
      })
    ];

    // Summary Table Headers
    const summaryRows = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Category / Legend", bold: true, color: "0F172A" })] })], shading: { fill: "E2E8F0" } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Allocated Hours", bold: true, color: "0F172A" })] })], shading: { fill: "E2E8F0" } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "% of Week", bold: true, color: "0F172A" })] })], shading: { fill: "E2E8F0" } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Primary Time Window", bold: true, color: "0F172A" })] })], shading: { fill: "E2E8F0" } }),
        ]
      })
    ];

    state.legends.forEach(l => {
      const hours = legendCounts[l.id] || 0;
      const pct = ((hours / 168) * 100).toFixed(1);
      summaryRows.push(new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: l.name, bold: true, color: l.color.replace('#', '') })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${hours} hrs` })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${pct}%` })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: hours > 0 ? "Scheduled in Matrix" : "Not allocated" })] })] }),
        ]
      }));
    });

    // Unallocated row
    const unallocatedPct = ((unallocatedCount / 168) * 100).toFixed(1);
    summaryRows.push(new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Unallocated Time", bold: true, color: "64748B" })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${unallocatedCount} hrs` })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${unallocatedPct}%` })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Free Time / Buffer" })] })] }),
      ]
    }));

    docChildren.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: summaryRows
    }));

    // Section 2: Detailed Day-by-Day Chronological Agenda
    docChildren.push(new Paragraph({
      spacing: { before: 400, after: 120 },
      children: [
        new TextRun({ text: "2. Detailed Day-by-Day Task Agenda (Saturday to Friday)", bold: true, size: 24, color: "0F172A" })
      ]
    }));

    dailyAgendas.forEach(dayAgenda => {
      docChildren.push(new Paragraph({
        spacing: { before: 200, after: 80 },
        children: [
          new TextRun({ text: `• ${dayAgenda.dayName}`, bold: true, size: 20, color: "1E3A8A" })
        ]
      }));

      // Group consecutive slots with identical legend into single task block
      const blocks = [];
      let currentBlock = null;

      dayAgenda.items.forEach(item => {
        if (!currentBlock || currentBlock.legendId !== item.legendId) {
          if (currentBlock) blocks.push(currentBlock);
          currentBlock = {
            legendId: item.legendId,
            legendName: item.legendName,
            color: item.color,
            startSlot: item.timeSlot.split(' - ')[0],
            endSlot: item.timeSlot.split(' - ')[1],
            count: 1
          };
        } else {
          currentBlock.endSlot = item.timeSlot.split(' - ')[1];
          currentBlock.count++;
        }
      });
      if (currentBlock) blocks.push(currentBlock);

      const dayRows = [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Time Window", bold: true, size: 14 })] })], shading: { fill: "F1F5F9" } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Allocated Activity / Task", bold: true, size: 14 })] })], shading: { fill: "F1F5F9" } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Duration", bold: true, size: 14 })] })], shading: { fill: "F1F5F9" } }),
          ]
        })
      ];

      blocks.forEach(b => {
        dayRows.push(new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${b.startSlot} - ${b.endSlot}`, size: 14, bold: true })] })] }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: b.legendName, size: 14, bold: true, color: b.color.replace('#', '') })] })],
              shading: { fill: b.legendId !== 'unallocated' ? "F8FAFC" : "FFFFFF" }
            }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${b.count} hour${b.count > 1 ? 's' : ''}`, size: 14 })] })] }),
          ]
        }));
      });

      docChildren.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: dayRows
      }));
    });

    // Section 3: Visual 7-Day x 24-Hour Matrix Schedule Table
    docChildren.push(new Paragraph({
      spacing: { before: 400, after: 120 },
      children: [
        new TextRun({ text: "3. Full Weekly 168-Hour Schedule Matrix (7 Days × 24 Hours)", bold: true, size: 24, color: "0F172A" })
      ]
    }));

    const matrixHeaderCells = [
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Time Slot", bold: true, size: 14 })] })], shading: { fill: "CBD5E1" } })
    ];
    state.days.forEach(day => {
      matrixHeaderCells.push(new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: day, bold: true, size: 14 })] })], shading: { fill: "CBD5E1" } }));
    });
    const matrixRows = [new TableRow({ children: matrixHeaderCells })];

    state.slots.forEach((slotLabel, slotIndex) => {
      const rowCells = [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: slotLabel, size: 12, bold: true })] })], shading: { fill: "F1F5F9" } })
      ];

      state.days.forEach((dayName, dayIndex) => {
        const key = `${dayIndex}_${slotIndex}`;
        const legendId = state.grid[key];
        const legend = state.legends.find(l => l.id === legendId);

        const cellText = legend ? legend.name : "Free";
        const cellHex = legend ? legend.color.replace('#', '') : "FFFFFF";
        const textColor = legend ? getContrastTextColor(legend.color) : "94A3B8";

        rowCells.push(new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: cellText, size: 12, bold: !!legend, color: textColor })] })],
          shading: { fill: cellHex }
        }));
      });

      matrixRows.push(new TableRow({ children: rowCells }));
    });

    docChildren.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: matrixRows
    }));

    // Section 4: Personal Notes & Reflections
    docChildren.push(
      new Paragraph({
        spacing: { before: 400, after: 100 },
        children: [new TextRun({ text: "4. Personal Reflections & Weekly Goals", bold: true, size: 22, color: "0F172A" })]
      }),
      new Paragraph({
        children: [new TextRun({ text: "Use this section in Microsoft Word to manually document your reflections, goal milestones, and productivity notes:", italic: true, size: 16, color: "475569" })]
      }),
      new Paragraph({ spacing: { before: 100 }, children: [new TextRun({ text: "• Primary Focus Goal: ____________________________________________________" })] }),
      new Paragraph({ spacing: { before: 80 }, children: [new TextRun({ text: "• Secondary Focus Goal: __________________________________________________" })] }),
      new Paragraph({ spacing: { before: 80 }, children: [new TextRun({ text: "• Habit Tracker: ________________________________________________________" })] }),
      new Paragraph({ spacing: { before: 80 }, children: [new TextRun({ text: "• End of Week Reflection: ________________________________________________" })] })
    );

    const doc = new Document({
      sections: [{ properties: {}, children: docChildren }]
    });

    const blob = await Packer.toBlob(doc);
    this.downloadFile(blob, `Weekly_168_Hour_Plan.docx`);
  },

  /**
   * Word HTML Document format fallback (.doc / .docx compatible)
   */
  generateWordHtmlDoc(state, getContrastTextColor) {
    const legendCounts = {};
    state.legends.forEach(l => legendCounts[l.id] = 0);
    let unallocatedCount = 0;

    // Day-by-Day Agenda extraction
    const dailyAgendas = state.days.map((dayName, dayIndex) => {
      const items = [];
      state.slots.forEach((slotLabel, slotIndex) => {
        const key = `${dayIndex}_${slotIndex}`;
        const legendId = state.grid[key];
        const legend = state.legends.find(l => l.id === legendId);
        items.push({
          slotIndex,
          timeSlot: slotLabel,
          legendId: legendId || 'unallocated',
          legendName: legend ? legend.name : 'Unallocated Time',
          color: legend ? legend.color : '#64748b'
        });

        if (legendId && legendCounts[legendId] !== undefined) {
          legendCounts[legendId]++;
        } else {
          unallocatedCount++;
        }
      });
      return { dayName, dayIndex, items };
    });

    const age = state.userAge || 28;
    const weeksLived = Math.round(age * 52.1429);
    const weeksRemaining = Math.max(0, 4000 - weeksLived);

    // Build Legend Rows HTML
    let legendRowsHtml = state.legends.map(l => {
      const hrs = legendCounts[l.id] || 0;
      const pct = ((hrs / 168) * 100).toFixed(1);
      return `
        <tr>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; color: ${l.color};">${l.name}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${hrs} hrs</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${pct}%</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px; color: #475569;">Allocated in weekly plan</td>
        </tr>
      `;
    }).join('');

    const unallocatedPct = ((unallocatedCount / 168) * 100).toFixed(1);
    legendRowsHtml += `
      <tr>
        <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #64748b;">Unallocated Time</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${unallocatedCount} hrs</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${unallocatedPct}%</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11px; color: #475569;">Free buffer time</td>
      </tr>
    `;

    // Build Day-by-Day Agenda HTML
    let dailyAgendaHtml = dailyAgendas.map(dayAgenda => {
      // Group consecutive blocks
      const blocks = [];
      let currentBlock = null;

      dayAgenda.items.forEach(item => {
        if (!currentBlock || currentBlock.legendId !== item.legendId) {
          if (currentBlock) blocks.push(currentBlock);
          currentBlock = {
            legendId: item.legendId,
            legendName: item.legendName,
            color: item.color,
            startSlot: item.timeSlot.split(' - ')[0],
            endSlot: item.timeSlot.split(' - ')[1],
            count: 1
          };
        } else {
          currentBlock.endSlot = item.timeSlot.split(' - ')[1];
          currentBlock.count++;
        }
      });
      if (currentBlock) blocks.push(currentBlock);

      const blockRows = blocks.map(b => `
        <tr>
          <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; font-size: 11px; text-align: center;">${b.startSlot} - ${b.endSlot}</td>
          <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; font-size: 11px; color: ${b.color};">${b.legendName}</td>
          <td style="padding: 6px; border: 1px solid #cbd5e1; font-size: 11px; text-align: center;">${b.count} hr${b.count > 1 ? 's' : ''}</td>
        </tr>
      `).join('');

      return `
        <div style="margin-top: 15px; margin-bottom: 20px;">
          <h3 style="color: #1e3a8a; margin-bottom: 8px; font-size: 14px;">• ${dayAgenda.dayName} Agenda</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f1f5f9; font-size: 11px;">
                <th style="padding: 6px; border: 1px solid #cbd5e1; width: 30%;">Time Window</th>
                <th style="padding: 6px; border: 1px solid #cbd5e1; width: 50%;">Allocated Activity / Task</th>
                <th style="padding: 6px; border: 1px solid #cbd5e1; width: 20%;">Duration</th>
              </tr>
            </thead>
            <tbody>
              ${blockRows}
            </tbody>
          </table>
        </div>
      `;
    }).join('');

    // Build 7-Day Matrix HTML
    let gridHeaderHtml = state.days.map(d => `<th style="padding: 6px; border: 1px solid #94a3b8; background-color: #1e293b; color: white; font-size: 11px;">${d}</th>`).join('');

    let gridRowsHtml = state.slots.map((slotLabel, slotIndex) => {
      let cellsHtml = state.days.map((d, dayIndex) => {
        const key = `${dayIndex}_${slotIndex}`;
        const legendId = state.grid[key];
        const legend = state.legends.find(l => l.id === legendId);

        const text = legend ? legend.name : '';
        const bg = legend ? legend.color : '#ffffff';
        const color = legend ? '#' + getContrastTextColor(legend.color) : '#94a3b8';

        return `<td style="padding: 4px; border: 1px solid #cbd5e1; background-color: ${bg}; color: ${color}; font-size: 10px; font-weight: bold; text-align: center;">${text}</td>`;
      }).join('');

      return `
        <tr>
          <td style="padding: 4px; border: 1px solid #94a3b8; background-color: #f1f5f9; font-weight: bold; font-size: 10px; text-align: center;">${slotLabel}</td>
          ${cellsHtml}
        </tr>
      `;
    }).join('');

    const htmlString = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Weekly 168-Hour Plan & Tasks Agenda</title>
        <style>
          body { font-family: Arial, sans-serif; color: #1e293b; padding: 25px; }
          h1 { color: #1e3a8a; text-align: center; font-size: 24px; margin-bottom: 5px; }
          .subtitle { text-align: center; color: #64748b; font-style: italic; font-size: 12px; margin-bottom: 25px; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
          .section-title { font-size: 16px; font-weight: bold; color: #0f172a; margin-top: 25px; margin-bottom: 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; }
        </style>
      </head>
      <body>
        <h1>MY WEEKLY 168-HOUR TIME & TASK PLAN</h1>
        <div class="subtitle">
          Human Life Perspective: ~4,000 Weeks (~76.9 Years) | Age: ${age} | Weeks Lived: ${weeksLived.toLocaleString()} | Weeks Remaining: ${weeksRemaining.toLocaleString()}
        </div>

        <div class="section-title">1. Weekly Category Allocation (168 Hours Total)</div>
        <table>
          <thead>
            <tr style="background-color: #e2e8f0; font-size: 12px;">
              <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: left;">Category / Legend</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1;">Allocated Hours</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1;">% of Week</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1;">Notes</th>
            </tr>
          </thead>
          <tbody>
            ${legendRowsHtml}
          </tbody>
        </table>

        <div class="section-title">2. Detailed Day-by-Day Task Agenda (Saturday to Friday)</div>
        ${dailyAgendaHtml}

        <div class="section-title">3. Full 7-Day × 24-Hour Schedule Matrix (10:00 PM to 9:00 PM)</div>
        <table>
          <thead>
            <tr>
              <th style="padding: 6px; border: 1px solid #94a3b8; background-color: #1e293b; color: white; font-size: 11px;">Time Slot</th>
              ${gridHeaderHtml}
            </tr>
          </thead>
          <tbody>
            ${gridRowsHtml}
          </tbody>
        </table>

        <div class="section-title">4. Personal Reflections & Goals Worksheet</div>
        <p style="font-size: 12px; color: #475569; font-style: italic;">Edit this Word document directly to refine your goals and weekly priorities.</p>
        <p style="font-size: 12px;">• Primary Focus Goal: ____________________________________________________________________</p>
        <p style="font-size: 12px;">• Secondary Goal: ________________________________________________________________________</p>
        <p style="font-size: 12px;">• Habit Milestones: _______________________________________________________________________</p>
        <p style="font-size: 12px;">• Weekly Reflection Notes: ________________________________________________________________</p>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + htmlString], { type: 'application/msword' });
    this.downloadFile(blob, `Weekly_168_Hour_Plan.docx`);
  },

  downloadFile(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

};
