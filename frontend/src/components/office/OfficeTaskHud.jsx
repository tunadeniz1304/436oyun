import { useMemo, useState, useEffect, useRef } from 'react';
import './OfficeTaskHud.css';

const ROLE_LABELS = {
  'Log Analysis Engineer':    'Classify Log Output',
  'Defect Triage Lead':       'Validate Defect Report',
  'Backend Engineer':         'Read Stack Trace',
  'QA Engineer':              'Reproduce the Bug',
  'V&V Lead':                 'Route Mission Cards',
  'Verification Specialist':  'Verify Conformance',
  'Validation Specialist':    'Validate User Stories',
  'Test Level Architect':     'Fill the Test Matrix',
  'Test Level Analyst':       'Analyse Test Levels',
  'Artefact Curator':         'Tag the Artefacts',
  'Static Analysis Lead':     'Review Static Artefacts',
};

function quizLabel(npc) {
  if (ROLE_LABELS[npc.role]) return ROLE_LABELS[npc.role];
  return `Help — ${npc.role}`;
}

function buildTasks({ npcs, completedQuests, officeStage, zoneDone }) {
  const manager = npcs.find(n => n.type === 'main');
  const quizNpcs = npcs.filter(n => n.quiz);
  const managerName = manager ? manager.name.split(' ')[0] : 'Manager';

  const tasks = [];

  tasks.push({
    id: 'briefing',
    where: 'Manager Desk',
    name: `Receive Briefing — ${managerName}`,
    status: officeStage === 'briefing' ? 'active' : 'done',
    meta: 'Step 1',
  });

  let firstActivated = false;
  for (const npc of quizNpcs) {
    const isDone = completedQuests.has(npc.id);
    let status;
    if (isDone) {
      status = 'done';
    } else if (officeStage === 'workers-pending' && !firstActivated) {
      status = 'active';
      firstActivated = true;
    } else {
      status = 'pending';
    }
    const isoRef = npc.quiz?.choices?.[0]?.isoRef ?? '';
    tasks.push({
      id: npc.id,
      where: npc.role,
      name: `${quizLabel(npc)} — ${npc.name.split(' ')[0]}`,
      status,
      meta: isoRef ? `Quiz · ${isoRef}` : 'Quiz',
    });
  }

  {
    let status;
    if (officeStage === 'zone-done') status = 'done';
    else if (officeStage === 'workers-done') status = 'active';
    else status = 'pending';
    tasks.push({
      id: 'return',
      where: 'Manager Desk',
      name: `Return to Manager — ${managerName}`,
      status,
      meta: 'Step 3',
    });
  }

  {
    let status;
    if (zoneDone) status = 'done';
    else if (officeStage === 'workers-done') status = 'active';
    else status = 'pending';
    tasks.push({
      id: 'console',
      where: 'Your Desk',
      name: 'Open the Office Console',
      status,
      meta: 'Final step',
    });
  }

  tasks.push({
    id: 'exit',
    where: 'Exit Door',
    name: 'Leave the Office',
    status: zoneDone ? 'active' : 'pending',
    meta: 'On complete',
  });

  return tasks;
}

const STATUS_ICON = { done: '✓', active: '▶', pending: '○' };
const AUTO_COLLAPSE_MS = 3500;

/**
 * @param {{ zoneLabel: string, zoneColor: string, npcs: object[], completedQuests: Set<string>, officeStage: string, zoneDone: boolean }} props
 */
export default function OfficeTaskHud({ zoneLabel, zoneColor, npcs, completedQuests, officeStage, zoneDone }) {
  const [expanded, setExpanded] = useState(false);
  const userToggledRef = useRef(false);
  const collapseTimerRef = useRef(null);

  const tasks = useMemo(
    () => buildTasks({ npcs, completedQuests, officeStage, zoneDone }),
    [npcs, completedQuests, officeStage, zoneDone],
  );

  const doneCount  = tasks.filter(t => t.status === 'done').length;
  const activeTask = tasks.find(t => t.status === 'active');

  const scheduleCollapse = () => {
    clearTimeout(collapseTimerRef.current);
    collapseTimerRef.current = setTimeout(() => {
      if (!userToggledRef.current) {
        setExpanded(false);
      }
    }, AUTO_COLLAPSE_MS);
  };

  // Auto-expand on stage change (and on first mount) to draw attention
  useEffect(() => {
    if (userToggledRef.current) return;
    setExpanded(true);
    scheduleCollapse();
    return () => clearTimeout(collapseTimerRef.current);
  }, [officeStage]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggle = () => {
    userToggledRef.current = true;
    clearTimeout(collapseTimerRef.current);
    setExpanded(e => !e);
  };

  return (
    <div className={`otask${expanded ? ' otask--expanded' : ''}`}>

      <button
        className="otask__pill"
        onClick={handleToggle}
        aria-expanded={expanded}
        aria-label={expanded ? 'Collapse task list' : 'Expand task list'}
      >
        <span className="otask__dot" aria-hidden="true" />
        <span className="otask__pill-body">
          <span className="otask__eyebrow">CURRENT OBJECTIVE</span>
          <span className="otask__active-name">{activeTask?.name ?? 'All tasks complete'}</span>
        </span>
        <span className="otask__counter" aria-label={`${doneCount} of ${tasks.length} done`}>
          {doneCount}/{tasks.length}
        </span>
        <span className="otask__chevron" aria-hidden="true">{expanded ? '▴' : '▾'}</span>
      </button>

      {expanded && (
        <div className="otask__panel" role="list" aria-label="Task list">

          <div className="otask__progress-track" role="presentation">
            <div
              className="otask__progress-fill"
              style={{ width: `${(doneCount / tasks.length) * 100}%` }}
            />
          </div>

          <div className="otask__list">
            {tasks.map(t => (
              <div
                key={t.id}
                className={`otask__row otask__row--${t.status}`}
                role="listitem"
              >
                <span className="otask__row-icon" aria-hidden="true">{STATUS_ICON[t.status]}</span>
                <span className="otask__row-body">
                  <span className="otask__row-where">{t.where}</span>
                  <span className="otask__row-name">{t.name}</span>
                </span>
                <span className="otask__row-meta">{t.meta}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
