import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Button from '../shared/Button.jsx';
import ScoreRow from './ScoreRow.jsx';
import CascadingNote from './CascadingNote.jsx';
import { useGame } from '../../hooks/useGame.js';
import { useMotion } from '../../hooks/useMotion.js';
import { useCountUp } from '../../hooks/useCountUp.js';
import { REPORT_ROWS, ZONE_META } from '../../context/GameContext.jsx';
import './IncidentReport.css';

function escapeMarkdown(s) {
  return String(s).replace(/[`*_]/g, (ch) => `\\${ch}`);
}

function generateMarkdown({ state, totals, durationMin }) {
  const lines = [];
  lines.push('# ISO INCIDENT REPORT — Session #047');
  lines.push('');
  lines.push(`**Standard:** ISO/IEC/IEEE 29119-1:2022 — Software Testing — Part 1: General Concepts`);
  lines.push(`**Duration:** ~${durationMin} minutes`);
  lines.push(`**Total score:** ${totals} / 1000`);
  lines.push('');

  REPORT_ROWS.forEach((row) => {
    const score = state.zoneScores[row.key] ?? 0;
    const errors = state.wrongAnswers.filter((w) => w.zoneId === keyToZone(row.key)).length;
    lines.push(`## ${row.label}`);
    lines.push(`- ${row.subLabel}`);
    lines.push(`- Score: **${Math.round(score)} / 200**`);
    lines.push(`- Errors recorded: ${errors}`);
    if (errors > 0) {
      lines.push('- Wrong-answer detail:');
      state.wrongAnswers
        .filter((w) => w.zoneId === keyToZone(row.key))
        .forEach((w) => {
          lines.push(
            `  - [${w.isoRef}] item ${escapeMarkdown(w.itemId)} — answered \`${escapeMarkdown(
              w.playerAnswer
            )}\`, expected \`${escapeMarkdown(w.correctAnswer)}\``
          );
        });
    }
    lines.push('');
  });

  return lines.join('\n');
}

function keyToZone(key) {
  // 'oracle' is recorded in zone 2's wrong answers + final-inspection's
  if (key === 'oracle') return 'vv-headquarters';
  return key;
}

function downloadMarkdown(filename, body) {
  const blob = new Blob([body], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function IncidentReport({ durationMin }) {
  const navigate = useNavigate();
  const { state, resetZone } = useGame();

  const totals = Math.round(
    REPORT_ROWS.reduce((sum, row) => sum + (state.zoneScores[row.key] ?? 0), 0)
  );
  const animatedTotal = useCountUp(totals, 1100);

  const reveal = useMotion({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45 },
  });

  const handleReplay = (rowKey) => {
    if (rowKey === 'oracle') {
      // Replay the V&V Headquarters zone (where oracle prompt lives)
      resetZone('vv-headquarters');
      navigate('/zone/vv-headquarters');
      return;
    }
    resetZone(rowKey);
    const target = {
      'error-district': '/zone/error-district',
      'vv-headquarters': '/zone/vv-headquarters',
      'matrix-tower': '/zone/matrix-tower',
      'artefact-archive': '/zone/artefact-archive',
    }[rowKey];
    if (target) navigate(target);
  };

  return (
    <motion.section className="incident-report" {...reveal}>
      <header className="incident-report__head">
        <div>
          <span className="incident-report__pill">ISO INCIDENT REPORT</span>
          <h2 className="incident-report__title">Session #047 — outcome</h2>
          <p className="incident-report__sub">
            ISO/IEC/IEEE 29119-1:2022 — Part 1: General Concepts · run duration ~{durationMin} min
          </p>
        </div>
      </header>

      <div className="incident-report__rows">
        {REPORT_ROWS.map((row, idx) => {
          const score = state.zoneScores[row.key] ?? 0;
          const meta = ZONE_META[row.key] ?? {
            color: 'var(--final-color)',
            bg: 'var(--final-bg)',
          };
          const errors = state.wrongAnswers.filter(
            (w) => w.zoneId === keyToZone(row.key)
          ).length;
          // First clause encountered for this row, if any
          const violated =
            state.wrongAnswers.find((w) => w.zoneId === keyToZone(row.key))?.isoRef ?? null;
          return (
            <ScoreRow
              key={row.key}
              rowKey={row.key}
              label={row.label}
              subLabel={row.subLabel}
              score={score}
              zoneColor={meta.color}
              errorCount={errors}
              violatedClause={violated}
              onReplay={() => handleReplay(row.key)}
              index={idx}
            />
          );
        })}
      </div>

      <div className="incident-report__total">
        <div>
          <span className="incident-report__total-label">TOTAL</span>
          <div className="incident-report__total-value">
            <strong>{animatedTotal}</strong>
            <span> / 1000</span>
          </div>
        </div>
        <CascadingNote />
        <Button
          variant="primary"
          size="lg"
          zoneColor="var(--final-color)"
          onClick={() =>
            downloadMarkdown(
              'iso-incident-report-047.md',
              generateMarkdown({ state, totals, durationMin })
            )
          }
        >
          Download report (.md)
        </Button>
      </div>
    </motion.section>
  );
}

export default IncidentReport;
