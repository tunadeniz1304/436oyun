import test from 'node:test';
import assert from 'node:assert/strict';
import { getZoneSkipTarget } from './zoneNavigation.js';

test('getZoneSkipTarget returns the next playable route for zone pages', () => {
  assert.deepEqual(getZoneSkipTarget('error-district'), {
    zoneId: 'vv-headquarters',
    route: '/zone/vv-headquarters',
    label: 'Skip to Zone 2',
  });

  assert.deepEqual(getZoneSkipTarget('vv-headquarters'), {
    zoneId: 'matrix-tower',
    route: '/zone/matrix-tower',
    label: 'Skip to Zone 3',
  });

  assert.deepEqual(getZoneSkipTarget('matrix-tower'), {
    zoneId: 'artefact-archive',
    route: '/zone/artefact-archive',
    label: 'Skip to Zone 4',
  });

  assert.deepEqual(getZoneSkipTarget('artefact-archive'), {
    zoneId: 'final-inspection',
    route: '/final-inspection',
    label: 'Skip to Final',
  });
});

test('getZoneSkipTarget returns null when there is no next zone', () => {
  assert.equal(getZoneSkipTarget('final-inspection'), null);
  assert.equal(getZoneSkipTarget('unknown-zone'), null);
});
