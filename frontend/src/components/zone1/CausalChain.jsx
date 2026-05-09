import { motion } from 'framer-motion';
import { useMotion } from '../../hooks/useMotion.js';
import './CausalChain.css';

function StageBox({ label, sublabel, color, delay }) {
  const stageMotion = useMotion({
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, delay, ease: 'easeOut' },
  });
  return (
    <motion.div
      className="causal-chain__stage"
      style={{ borderColor: color, color }}
      {...stageMotion}
    >
      <div className="causal-chain__stage-label">{label}</div>
      <div className="causal-chain__stage-sublabel">{sublabel}</div>
    </motion.div>
  );
}

function ConnectingArrow({ word, delay }) {
  const arrowMotion = useMotion({
    initial: { pathLength: 0, opacity: 0 },
    animate: { pathLength: 1, opacity: 1 },
    transition: { duration: 0.5, delay, ease: 'easeOut' },
  });
  const labelMotion = useMotion({
    initial: { opacity: 0, y: -4 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, delay: delay + 0.25 },
  });

  return (
    <div className="causal-chain__arrow-group">
      <motion.span className="causal-chain__arrow-word" {...labelMotion}>
        {word}
      </motion.span>
      <svg
        viewBox="0 0 80 16"
        width="80"
        height="16"
        aria-hidden="true"
        className="causal-chain__arrow-svg"
      >
        <motion.path
          d="M2 8 H68"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          {...arrowMotion}
        />
        <motion.path
          d="M62 4 L70 8 L62 12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          {...arrowMotion}
        />
      </svg>
    </div>
  );
}

function CausalChain() {
  return (
    <div className="causal-chain" role="figure" aria-label="Causal chain: Error causes Fault, Fault triggers Failure">
      <StageBox label="ERROR"   sublabel="human action"          color="var(--zone1-color)" delay={0.0} />
      <ConnectingArrow word="causes"   delay={0.15} />
      <StageBox label="FAULT"   sublabel="flaw inside the code"  color="var(--zone1-color)" delay={0.30} />
      <ConnectingArrow word="triggers" delay={0.45} />
      <StageBox label="FAILURE" sublabel="observable deviation"  color="var(--zone1-color)" delay={0.60} />
    </div>
  );
}

export default CausalChain;
