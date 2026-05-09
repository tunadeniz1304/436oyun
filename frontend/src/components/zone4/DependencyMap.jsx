import { motion } from 'framer-motion';
import { useMotion } from '../../hooks/useMotion.js';
import './DependencyMap.css';

/**
 * Static SVG showing how the 6 artefacts relate.
 * Renders after Zone 4 completion as a closing summary.
 */
function DependencyMap() {
  const fadeIn = useMotion({
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.5 },
  });

  return (
    <motion.section className="dep-map" {...fadeIn} aria-label="Artefact dependency map">
      <h3 className="dep-map__title">Artefact dependencies</h3>
      <p className="dep-map__sub">
        How these six artefacts relate — the basis informs the test item, and
        the run produces the log.
      </p>
      <svg viewBox="0 0 640 220" width="100%" height="220" role="img">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="var(--zone4-color)" />
          </marker>
        </defs>

        {/* Basis nodes (left column) */}
        <g>
          <rect x="10"  y="10"  width="180" height="40" rx="6" fill="#ffffff" stroke="var(--zone4-color)" strokeWidth="1.5" />
          <text x="100" y="35" textAnchor="middle" fontSize="13" fill="var(--ink)" fontFamily="ui-monospace, monospace">requirements_v2.docx</text>

          <rect x="10"  y="60"  width="180" height="40" rx="6" fill="#ffffff" stroke="var(--zone4-color)" strokeWidth="1.5" />
          <text x="100" y="85" textAnchor="middle" fontSize="13" fill="var(--ink)" fontFamily="ui-monospace, monospace">design_review_minutes.md</text>

          <rect x="10"  y="110" width="180" height="40" rx="6" fill="#ffffff" stroke="var(--zone4-color)" strokeWidth="1.5" />
          <text x="100" y="135" textAnchor="middle" fontSize="13" fill="var(--ink)" fontFamily="ui-monospace, monospace">architecture_diagram.svg</text>

          <rect x="10"  y="160" width="180" height="40" rx="6" fill="var(--zone4-bg)" stroke="var(--zone4-color)" strokeWidth="1.5" strokeDasharray="4 3" />
          <text x="100" y="185" textAnchor="middle" fontSize="13" fill="var(--ink)" fontFamily="ui-monospace, monospace">verbal_agreement.txt</text>
        </g>

        <text x="100" y="216" textAnchor="middle" fontSize="11" fill="var(--zone4-color)" fontWeight="600">test basis (§3.84)</text>

        {/* Test item (centre) */}
        <g>
          <rect x="270" y="80" width="180" height="50" rx="6" fill="var(--zone4-bg)" stroke="var(--zone4-color)" strokeWidth="2" />
          <text x="360" y="100" textAnchor="middle" fontSize="13" fill="var(--ink)" fontFamily="ui-monospace, monospace">login_module.py</text>
          <text x="360" y="118" textAnchor="middle" fontSize="11" fill="var(--zone4-color)" fontWeight="600">test item / object (§3.107)</text>
        </g>

        {/* Output (right) */}
        <g>
          <rect x="510" y="80" width="120" height="50" rx="6" fill="#ffffff" stroke="var(--muted)" strokeWidth="1.4" />
          <text x="570" y="100" textAnchor="middle" fontSize="12" fill="var(--ink)" fontFamily="ui-monospace, monospace">login_test_run.log</text>
          <text x="570" y="118" textAnchor="middle" fontSize="10.5" fill="var(--muted)">testware output</text>
        </g>

        {/* Arrows: basis → test item */}
        <path d="M190  30 C 230  30, 240  90, 270 95"  stroke="var(--zone4-color)" strokeWidth="1.4" fill="none" markerEnd="url(#arrow)" />
        <path d="M190  80 C 220  90, 240  95, 270 100" stroke="var(--zone4-color)" strokeWidth="1.4" fill="none" markerEnd="url(#arrow)" />
        <path d="M190 130 C 220 120, 240 115, 270 110" stroke="var(--zone4-color)" strokeWidth="1.4" fill="none" markerEnd="url(#arrow)" />
        <path d="M190 180 C 230 160, 250 130, 270 115" stroke="var(--zone4-color)" strokeWidth="1.4" strokeDasharray="3 3" fill="none" markerEnd="url(#arrow)" />

        {/* Arrow: test item → log */}
        <path d="M450 105 L 510 105" stroke="var(--muted)" strokeWidth="1.4" fill="none" markerEnd="url(#arrow)" />

        {/* Caption */}
        <text x="320" y="160" textAnchor="middle" fontSize="11" fill="var(--ink-soft)" fontStyle="italic">
          dynamic test execution
        </text>
        <text x="570" y="148" textAnchor="middle" fontSize="11" fill="var(--ink-soft)" fontStyle="italic">
          run output
        </text>
      </svg>
    </motion.section>
  );
}

export default DependencyMap;
