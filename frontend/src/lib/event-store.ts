// In-memory stores for mock data sharing between routes

export const eventAttendanceCodes: Record<string, string> = {};

export const studentAttendanceRecords: Record<string, Record<string, boolean>> = {};

export const eventQrTokens: Record<string, { token: string; qrUrl: string }> = {};

export type QrOption = "auto" | "uploaded";

export const eventQrData: Record<string, { type: QrOption; imageUrl?: string }> = {};

export const eventRejectionReasons: Record<string, string> = {};

export function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function markAttendance(
  eventId: string,
  studentId: string,
  code: string,
): "ok" | "already" | "invalid" {
  if (studentAttendanceRecords[eventId]?.[studentId]) return "already";
  if (eventAttendanceCodes[eventId] !== code) return "invalid";
  if (!studentAttendanceRecords[eventId]) studentAttendanceRecords[eventId] = {};
  studentAttendanceRecords[eventId][studentId] = true;
  return "ok";
}
