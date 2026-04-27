import { useGame } from '../../hooks/useGame.js';
import './CascadingNote.css';

/**
 * Cascading-note logic per build instructions §F.11.5:
 *   - if Zone 3 score < 200, note that the partial answer affected oracle
 *     confidence in Final step 5
 *   - if oracle wrong answer recorded for Final, note the §3.115 Note 1
 *     internalisation gap
 */
function CascadingNote() {
  const { state } = useGame();
  const notes = [];

  if ((state.zoneScores['matrix-tower'] ?? 0) < 200) {
    notes.push(
      'Cascading note: your Zone 3 partial answer likely affected oracle confidence in Final step 5 — partial coverage of test types across levels narrows what you know your oracle should sign off on.'
    );
  }
  const oracleWrong = state.wrongAnswers.find(
    (w) => w.zoneId === 'final-inspection' && w.itemId === 'fi-s5'
  );
  if (oracleWrong) {
    notes.push(
      'Your oracle choice in Final shows the test-oracle problem (§3.115 Note 1) is not yet internalised — review the clause: oracles can be drawn from multiple sources at once.'
    );
  }
  if ((state.zoneScores['artefact-archive'] ?? 0) < 200) {
    notes.push(
      'Zone 4 left points on the table — review §3.84 Note 1 on undocumented test basis before the next sprint.'
    );
  }

  if (notes.length === 0) {
    return (
      <div className="cascading-note cascading-note--clean">
        Clean run — no cascading effects detected. The standard’s framing of
        Error → Fault → Failure, V&amp;V, level × type independence, undocumented
        basis, and partial oracle has been internalised.
      </div>
    );
  }

  return (
    <ul className="cascading-note">
      {notes.map((note, idx) => (
        <li key={idx} className="cascading-note__item">
          <em>{note}</em>
        </li>
      ))}
    </ul>
  );
}

export default CascadingNote;
