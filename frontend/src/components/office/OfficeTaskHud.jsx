import { useMemo } from 'react';
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

/**
 * Build an ordered task array from props.
 * Returns: { id, where, name, status: 'done'|'active'|'pending', meta }[]
 */
function buildTasks({ npcs, completedQuests, officeStage, zoneDone }) {
  const manager = npcs.find(n => n.type === 'main');
  const quizNpcs = npcs.filter(n => n.quiz);
  const managerName = manager ? manager.name.split(' ')[0] : 'Manager';

  const tasks = [];

  // Step 1 — briefing
  tasks.push({
    id: 'briefing',
    where: 'Manager Desk',
    name: `Receive Briefing — ${managerName}`,
    status: officeStage === 'briefing' ? 'active' : 'done',
    meta: 'Step 1',
  });

  // Steps 2..N — one per quiz NPC in declaration order
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

  // Step N+1 — return to manager
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

  // Step N+2 — open the console
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

  // Step N+3 — leave
  tasks.push({
    id: 'exit',
    where: 'Exit Door',
    name: 'Leave the Office',
    status: zoneDone ? 'active' : 'pending',
    meta: 'On complete',
  });

  return tasks;
}

/**
 * @param {{ zoneLabel: string, zoneColor: string, npcs: object[], completedQuests: Set<string>, officeStage: string, zoneDone: boolean }} props
 */
export default function OfficeTaskHud({ zoneLabel, zoneColor, npcs, completedQuests, officeStage, zoneDone }) {
  const tasks = useMemo(
    () => buildTasks({ npcs, completedQuests, officeStage, zoneDone }),
    [npcs, completedQuests, officeStage, zoneDone],
  );

  const doneCount  = tasks.filter(t => t.status === 'done').length;
  const activeTask = tasks.find(t => t.status === 'active');

  // temporary plain render — styled in commit 3+
  return (
    <div style={{ position: 'absolute', top: 64, left: 16, zIndex: 120, background: 'rgba(0,0,0,0.7)', color: '#fff', padding: 8, borderRadius: 8, fontSize: 12, maxWidth: 280 }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{doneCount}/{tasks.length} — {activeTask?.name ?? 'Done'}</div>
      <ul style={{ margin: 0, paddingLeft: 16 }}>
        {tasks.map(t => (
          <li key={t.id} style={{ opacity: t.status === 'pending' ? 0.45 : 1, textDecoration: t.status === 'done' ? 'line-through' : 'none', marginBottom: 2 }}>
            {t.status === 'done' ? '✓' : t.status === 'active' ? '▶' : '○'} {t.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
