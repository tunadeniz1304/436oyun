import './ProgressTracker.css';

function ProgressTracker({ completed, total }) {
  const pct = Math.round((completed / total) * 100);
  return (
    <div
      className="progress-tracker"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={completed}
      aria-label={`${completed} of ${total} zones complete`}
    >
      <div className="progress-tracker__label">
        <strong>{completed}</strong>
        <span className="progress-tracker__divider"> / </span>
        <span>{total} zones complete</span>
      </div>
      <div className="progress-tracker__bar" aria-hidden="true">
        <div
          className="progress-tracker__fill"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default ProgressTracker;
