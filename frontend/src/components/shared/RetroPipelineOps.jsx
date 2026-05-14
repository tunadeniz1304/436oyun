import { useState } from 'react';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import './RetroPipelineOps.css';

const STAGES = [
  { id: 'unit',        label: 'Unit',        icon: '🔬', isoRef: '§3.108' },
  { id: 'integration', label: 'Integration', icon: '🔗', isoRef: '§3.108' },
  { id: 'system',      label: 'System',      icon: '🖥️', isoRef: '§3.108' },
  { id: 'acceptance',  label: 'Acceptance',  icon: '✅', isoRef: '§3.108' },
];

const DECK = [
  {
    id: 'p1',
    text: 'Verify that the calculateTotal() function returns the right sum for edge-case inputs',
    correctStage: 'unit',
    isoRef: '§3.108',
    explanation: 'Testing a single isolated function is Unit level — it does not involve other components or the full system.',
  },
  {
    id: 'p2',
    text: 'Confirm that the payment service correctly calls the inventory API when an order is placed',
    correctStage: 'integration',
    isoRef: '§3.108',
    explanation: 'Testing how two components communicate with each other is Integration level — the focus is the interface between units.',
  },
  {
    id: 'p3',
    text: 'Run the full order-to-dispatch flow end-to-end in the staging environment',
    correctStage: 'system',
    isoRef: '§3.108',
    explanation: 'Testing the complete integrated system as a whole in a near-production environment is System level.',
  },
  {
    id: 'p4',
    text: 'Have real users from the pilot group place test orders and confirm the experience meets their needs',
    correctStage: 'acceptance',
    isoRef: '§3.108',
    explanation: 'Testing with real stakeholders to confirm fitness for intended use is Acceptance level — it answers "did we build the right thing?"',
  },
  {
    id: 'p5',
    text: 'Check that the parseDate() utility handles null, empty string, and invalid formats',
    correctStage: 'unit',
    isoRef: '§3.108',
    explanation: 'A utility function tested in isolation with no other components involved — this is Unit level.',
  },
  {
    id: 'p6',
    text: 'Verify that the shipping microservice updates the tracking database after the fulfilment service confirms dispatch',
    correctStage: 'integration',
    isoRef: '§3.108',
    explanation: 'Testing the contract between two microservices — the shipping service and the fulfilment service — is Integration level.',
  },
];

function DraggableCard({ card }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: card.id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 999 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={['pipeline-ops__card', isDragging ? 'pipeline-ops__card--dragging' : ''].join(' ')}
      {...listeners}
      {...attributes}
    >
      <span className="pipeline-ops__card-text">{card.text}</span>
    </div>
  );
}

function StageSlot({ stage, placedCards }) {
  const { isOver, setNodeRef } = useDroppable({ id: stage.id });
  return (
    <div
      ref={setNodeRef}
      className={['pipeline-ops__stage', isOver ? 'pipeline-ops__stage--over' : ''].join(' ')}
    >
      <div className="pipeline-ops__stage-header">
        <span className="pipeline-ops__stage-icon">{stage.icon}</span>
        <span className="pipeline-ops__stage-label">{stage.label}</span>
        <span className="pipeline-ops__stage-ref">{stage.isoRef}</span>
      </div>
      <div className="pipeline-ops__stage-cards">
        {placedCards.map(c => (
          <div key={c.id} className="pipeline-ops__placed-card">
            {c.text}
          </div>
        ))}
        {placedCards.length === 0 && (
          <div className="pipeline-ops__stage-empty">Drop test here</div>
        )}
      </div>
    </div>
  );
}

export default function RetroPipelineOps({ onClose }) {
  const [placed, setPlaced]         = useState({});
  const [wrongFlash, setWrongFlash] = useState(null);
  const [wrongInfo, setWrongInfo]   = useState(null);
  const [status, setStatus]         = useState('playing');
  const [score, setScore]           = useState(0);

  const handleDragEnd = ({ active, over }) => {
    if (!over) return;
    const card = DECK.find(c => c.id === active.id);
    if (!card) return;
    if (placed[card.id]) return;

    const isCorrect = card.correctStage === over.id;
    if (isCorrect) {
      const newPlaced = { ...placed, [card.id]: over.id };
      const newScore = score + 1;
      setPlaced(newPlaced);
      setScore(newScore);
      setWrongInfo(null);
      if (newScore === DECK.length) {
        setStatus('won');
      }
    } else {
      setWrongFlash(card.id);
      setWrongInfo({ cardId: card.id, explanation: card.explanation });
      setTimeout(() => setWrongFlash(null), 500);
    }
  };

  const handleReset = () => {
    setPlaced({});
    setScore(0);
    setWrongFlash(null);
    setWrongInfo(null);
    setStatus('playing');
  };

  const unplacedCards = DECK.filter(c => !placed[c.id]);

  if (status === 'won') {
    return (
      <div className="pipeline-ops pipeline-ops--result">
        <div className="pipeline-ops__result-title">🎉 Pipeline Complete!</div>
        <div className="pipeline-ops__result-score">Score: {score} / {DECK.length}</div>
        <div className="pipeline-ops__iso-callout">
          <div className="pipeline-ops__iso-callout-title">ISO/IEC/IEEE 29119-1 — §3.108 Test Level</div>
          <div className="pipeline-ops__iso-callout-def">
            <strong>Definition:</strong> specific instantiation of a test process
          </div>
          <div className="pipeline-ops__iso-callout-note">
            <strong>Note (§4.2.4.2):</strong> Test levels include unit testing, integration testing,
            system testing, and acceptance testing. Each level targets a different scope of the system
            under test — from individual components to the complete integrated product.
          </div>
        </div>
        <div className="pipeline-ops__result-btns">
          <button className="pipeline-ops__btn" onClick={handleReset}>Play Again</button>
          <button className="pipeline-ops__btn" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="pipeline-ops">
        <div className="pipeline-ops__header">
          <span className="pipeline-ops__title">🔧 PipelineOps.exe</span>
          <span className="pipeline-ops__progress">{score} / {DECK.length} placed</span>
        </div>

        <div className="pipeline-ops__instruction">
          Drag each test card into the correct CI pipeline stage.
        </div>

        <div className="pipeline-ops__stages">
          {STAGES.map(stage => (
            <StageSlot
              key={stage.id}
              stage={stage}
              placedCards={DECK.filter(c => placed[c.id] === stage.id)}
            />
          ))}
        </div>

        <div className="pipeline-ops__hand">
          {unplacedCards.map(card => (
            <div
              key={card.id}
              className={[
                'pipeline-ops__hand-slot',
                wrongFlash === card.id ? 'pipeline-ops__hand-slot--wrong' : '',
              ].join(' ')}
            >
              <DraggableCard card={card} />
            </div>
          ))}
          {unplacedCards.length === 0 && status !== 'won' && (
            <div className="pipeline-ops__hand-empty">All cards placed!</div>
          )}
        </div>

        {wrongInfo && (
          <div className="pipeline-ops__feedback">
            <span className="pipeline-ops__feedback-icon">❌</span>
            <span className="pipeline-ops__feedback-text">{wrongInfo.explanation}</span>
          </div>
        )}
      </div>
    </DndContext>
  );
}
