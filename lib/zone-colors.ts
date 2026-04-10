/**
 * Zone color utilities based on time since last work
 */

export interface ZoneColorInfo {
  color: string;
  label: string;
  description: string;
}

/**
 * Calculate days since a zone was last worked on
 */
function getDaysSinceLastWorked(lastWorkedAt: string | null): number | null {
  if (!lastWorkedAt) return null;
  const lastDate = new Date(lastWorkedAt);
  const now = new Date();
  const diffMs = now.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Get zone color based on days since last work
 * Week 1 (0-7 days): Green - recently maintained
 * Week 2 (8-14 days): Yellow - due soon
 * Week 3 (15-21 days): Orange - overdue
 * Week 4 (22-28 days): Red - urgent
 * Week 5+ (29+ days): Dark red - critical
 * Never worked: Gray
 */
export function getZoneColorByLastWorked(lastWorkedAt: string | null): string {
  const days = getDaysSinceLastWorked(lastWorkedAt);
  
  if (days === null) {
    return '#9ca3af'; // Gray - never worked
  }
  
  if (days <= 7) {
    return '#22c55e'; // Green - fresh (week 1)
  } else if (days <= 14) {
    return '#eab308'; // Yellow - due soon (week 2)
  } else if (days <= 21) {
    return '#f97316'; // Orange - overdue (week 3)
  } else if (days <= 28) {
    return '#ef4444'; // Red - urgent (week 4)
  } else {
    return '#b91c1c'; // Dark red - critical (week 5+)
  }
}

/**
 * Get color info for legend display
 */
export function getZoneColorLegend(): ZoneColorInfo[] {
  return [
    { color: '#22c55e', label: 'Week 1', description: '0-7 days ago' },
    { color: '#eab308', label: 'Week 2', description: '8-14 days ago' },
    { color: '#f97316', label: 'Week 3', description: '15-21 days ago' },
    { color: '#ef4444', label: 'Week 4', description: '22-28 days ago' },
    { color: '#b91c1c', label: 'Week 5+', description: '29+ days ago' },
    { color: '#9ca3af', label: 'Never', description: 'No work logged' },
  ];
}

/**
 * Get human-readable label for zone status
 */
export function getZoneStatusLabel(lastWorkedAt: string | null): string {
  const days = getDaysSinceLastWorked(lastWorkedAt);
  
  if (days === null) {
    return 'Never worked';
  }
  
  if (days === 0) {
    return 'Today';
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days <= 7) {
    return `${days} days ago`;
  } else if (days <= 14) {
    return `${days} days ago (Week 2)`;
  } else if (days <= 21) {
    return `${days} days ago (Week 3)`;
  } else if (days <= 28) {
    return `${days} days ago (Week 4)`;
  } else {
    return `${days} days ago (Week 5+)`;
  }
}
