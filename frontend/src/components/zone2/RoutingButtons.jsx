import Button from '../shared/Button.jsx';
import './RoutingButtons.css';

const OPTIONS = [
  {
    key: 'verification',
    label: 'VERIFICATION',
    sublabel: 'conformance to specification',
  },
  {
    key: 'validation',
    label: 'VALIDATION',
    sublabel: 'fitness for intended use',
  },
  {
    key: 'both',
    label: 'BOTH',
    sublabel: 'requires justification',
  },
];

function RoutingButtons({ onSelect, selected, disabled = false }) {
  return (
    <div className="routing-buttons" role="group" aria-label="Route this mission">
      {OPTIONS.map((opt) => (
        <Button
          key={opt.key}
          variant={selected === opt.key ? 'primary' : 'secondary'}
          size="lg"
          zoneColor="var(--zone2-color)"
          onClick={() => onSelect(opt.key)}
          disabled={disabled}
          className="routing-buttons__btn"
          aria-pressed={selected === opt.key}
        >
          <span className="routing-buttons__label">{opt.label}</span>
          <span className="routing-buttons__sublabel">{opt.sublabel}</span>
        </Button>
      ))}
    </div>
  );
}

export default RoutingButtons;
