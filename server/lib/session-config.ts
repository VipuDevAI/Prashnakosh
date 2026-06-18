// Role-based session TTLs (milliseconds)
// Teacher/HOD/Admin: 24 hours | Student: 3 hours
export const SESSION_TTL: Record<string, number> = {
  student: 3 * 60 * 60 * 1000,
  teacher: 24 * 60 * 60 * 1000,
  hod: 24 * 60 * 60 * 1000,
  admin: 24 * 60 * 60 * 1000,
  super_admin: 24 * 60 * 60 * 1000,
  principal: 24 * 60 * 60 * 1000,
  exam_committee: 24 * 60 * 60 * 1000,
  parent: 24 * 60 * 60 * 1000,
};

export function getSessionTTL(role: string): number {
  return SESSION_TTL[role] || 24 * 60 * 60 * 1000;
}

export function extractTokenTimestamp(token: string): number | null {
  const match = token.match(/-(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}
