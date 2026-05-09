export const ZONE_ROUTES = {
  'error-district': '/zone/error-district',
  'vv-headquarters': '/zone/vv-headquarters',
  'matrix-tower': '/zone/matrix-tower',
  'artefact-archive': '/zone/artefact-archive',
  'final-inspection': '/final-inspection',
};

const SKIPPABLE_ZONE_ORDER = [
  'error-district',
  'vv-headquarters',
  'matrix-tower',
  'artefact-archive',
  'final-inspection',
];

export function getZoneSkipTarget(zoneId) {
  const idx = SKIPPABLE_ZONE_ORDER.indexOf(zoneId);
  if (idx < 0 || idx >= SKIPPABLE_ZONE_ORDER.length - 1) return null;

  const nextZoneId = SKIPPABLE_ZONE_ORDER[idx + 1];
  const isFinal = nextZoneId === 'final-inspection';

  return {
    zoneId: nextZoneId,
    route: ZONE_ROUTES[nextZoneId],
    label: isFinal ? 'Skip to Final' : `Skip to Zone ${idx + 2}`,
  };
}
