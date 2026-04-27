import { motion, AnimatePresence } from 'framer-motion';
import Button from '../shared/Button.jsx';
import ISOTooltip from '../shared/ISOTooltip.jsx';
import { useMotion } from '../../hooks/useMotion.js';
import './OraclePrompt.css';

const OPTIONS = [
  {
    key: 'spec',
    label: 'The written specification only',
    blurb: 'The runbook tells us pass-vs-fail.',
  },
  {
    key: 'human',
    label: 'A human expert only',
    blurb: 'On-call sign-off decides pass-vs-fail.',
  },
  {
    key: 'both',
    label: 'Both — partial oracle',
    blurb: 'Spec + a human expert, used together (§3.115 Note 1).',
  },
];

/**
 * OraclePrompt — slides in for the one mission flagged
 * `oraclePromptHere: true`. The "both — partial oracle" answer is the most
 * ISO-faithful, since §3.115 Note 1 explicitly enumerates multiple sources.
 */
function OraclePrompt({ open, answered, onChoose }) {
  const slideMotion = useMotion({
    initial: { opacity: 0, x: 24 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 24 },
    transition: { duration: 0.25, ease: 'easeOut' },
  });
  return (
    <AnimatePresence>
      {open ? (
        <motion.aside className="oracle-prompt" {...slideMotion}>
          <div className="oracle-prompt__head">
            <span className="oracle-prompt__tag">
              <ISOTooltip clauseRef="§3.115">test oracle</ISOTooltip>
            </span>
            <h3 className="oracle-prompt__title">What determines pass / fail here?</h3>
            <p className="oracle-prompt__intro">
              For this mission, identify the source of information that decides
              whether a test has passed or failed.
            </p>
          </div>
          <div className="oracle-prompt__options">
            {OPTIONS.map((opt) => (
              <Button
                key={opt.key}
                variant={answered === opt.key ? 'primary' : 'secondary'}
                size="md"
                zoneColor="var(--zone2-color)"
                onClick={() => !answered && onChoose(opt.key)}
                disabled={!!answered}
                className="oracle-prompt__option"
              >
                <span className="oracle-prompt__option-label">{opt.label}</span>
                <span className="oracle-prompt__option-blurb">{opt.blurb}</span>
              </Button>
            ))}
          </div>
          {answered ? (
            <p className="oracle-prompt__feedback">
              {answered === 'both'
                ? 'Correct framing — §3.115 Note 1 lists the spec, another similar system, AND a human expert as legitimate sources. +50 oracle points.'
                : 'A common but partial answer — §3.115 Note 1 reminds us oracles can come from multiple sources at once. No oracle points awarded.'}
            </p>
          ) : null}
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}

export default OraclePrompt;
