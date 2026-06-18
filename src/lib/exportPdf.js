import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { TRACKS, TRACK_BY_ID } from '../domain/constants.js'
import { isActive, upcomingDeadlines } from '../domain/metrics.js'
import { formatDate, relativeDeadline, daysUntil } from '../domain/dates.js'
import { formatSalary } from '../components/SalaryInput.jsx'

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

// One-click PDF: active applications grouped by track, deadlines clearly shown.
export function exportActivePdf(apps, now = new Date()) {
  const active = apps.filter(isActive)
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 40

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('Active Applications', margin, 50)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(110)
  doc.text(
    `Generated ${formatDate(now.toISOString())} · ${active.length} active across ${
      new Set(active.map((a) => a.track)).size
    } tracks`,
    margin,
    68,
  )

  // Deadline summary box up top — deadlines are the priority.
  const due = upcomingDeadlines(active, { now, activeOnly: true })
  const overdue = due.filter((d) => d.days < 0)
  let cursorY = 90
  if (due.length) {
    doc.setTextColor(30)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Deadlines — what is due next', margin, cursorY)
    cursorY += 8
    autoTable(doc, {
      startY: cursorY,
      head: [['Deadline', 'Company / Program', 'Track', 'When']],
      body: due
        .slice(0, 12)
        .map(({ app, days }) => [
          formatDate(app.deadline),
          app.company,
          TRACK_BY_ID[app.track]?.label ?? app.track,
          relativeDeadline(app.deadline, now),
        ]),
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [79, 70, 229] },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 3) {
          const row = due[data.row.index]
          if (row && row.days < 0) {
            data.cell.styles.textColor = [220, 38, 38]
            data.cell.styles.fontStyle = 'bold'
          }
        }
      },
      margin: { left: margin, right: margin },
    })
    cursorY = doc.lastAutoTable.finalY + 24
    if (overdue.length) {
      doc.setTextColor(220, 38, 38)
      doc.setFontSize(9)
      doc.text(`${overdue.length} overdue item(s) flagged in red above.`, margin, cursorY - 12)
    }
  }

  // One section per track that has active apps.
  for (const track of TRACKS) {
    const rows = active
      .filter((a) => a.track === track.id)
      .sort((a, b) => {
        const da = daysUntil(a.deadline, now)
        const db = daysUntil(b.deadline, now)
        if (da == null) return 1
        if (db == null) return -1
        return da - db
      })
    if (rows.length === 0) continue

    if (cursorY > doc.internal.pageSize.getHeight() - 120) {
      doc.addPage()
      cursorY = 50
    }

    const [r, g, b] = hexToRgb(track.color)
    doc.setFillColor(r, g, b)
    doc.roundedRect(margin, cursorY - 12, 10, 10, 2, 2, 'F')
    doc.setTextColor(20)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text(`${track.label}  (${rows.length})`, margin + 16, cursorY - 3)
    cursorY += 6

    autoTable(doc, {
      startY: cursorY,
      head: [['Company / Program', 'Role / Area', 'Stage', 'Deadline', 'Comp', 'Tags']],
      body: rows.map((a) => [
        a.company,
        a.role || '—',
        a.status,
        a.deadline ? `${formatDate(a.deadline)}\n(${relativeDeadline(a.deadline, now)})` : '—',
        formatSalary(a.salary) ?? '—',
        (a.tags ?? []).join(', ') || '—',
      ]),
      styles: { fontSize: 8.5, cellPadding: 4, valign: 'top' },
      headStyles: { fillColor: [r, g, b] },
      columnStyles: {
        0: { cellWidth: 110, fontStyle: 'bold' },
        3: { cellWidth: 90 },
      },
      margin: { left: margin, right: margin },
      tableWidth: pageWidth - margin * 2,
    })
    cursorY = doc.lastAutoTable.finalY + 28
  }

  if (active.length === 0) {
    doc.setTextColor(110)
    doc.setFontSize(11)
    doc.text('No active applications to report.', margin, cursorY)
  }

  doc.save(`applications-${now.toISOString().slice(0, 10)}.pdf`)
}
