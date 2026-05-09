import FeedbackModal from '../shared/FeedbackModal.jsx';
import { getISODefinition } from '../../data/iso-definitions.js';

/**
 * Reuses FeedbackModal with the §3.84 Note 1 content. This is the most
 * important teaching modal in the entire game — leaving the verbal_agreement
 * artefact untagged or as Test Item only without `basis` triggers it.
 */
function Note1Callout({ open, onClose }) {
  const def = getISODefinition('§3.84');
  return (
    <FeedbackModal
      isOpen={open}
      onClose={onClose}
      headerColor="var(--zone4-color)"
      title="§3.84 NOTE 1"
      isoRef="§3.84"
      term={def.term}
      definition={def.definition}
      note={def.note}
      playerAnswer="left verbal_agreement.txt without a Test Basis tag"
      explanation="A test basis does not have to be a written document. A verbal understanding that captures required behaviour qualifies — that is the heart of §3.84 Note 1, and the exact misconception this zone is built to expose."
    />
  );
}

export default Note1Callout;
