// lib/api.ts
//
// Thin wrapper around fetch, talking to the existing Express backend
// (server.js). The Next.js app is a separate project — it never
// touches the database directly, it calls this same API exactly like
// the old admin.html/exam.html pages already do.

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export type SchoolMeta = {
  schoolName?: string;
  address?: string;
  motto?: string;
  phone?: string;
  logo?: string;
  signaturePrincipal?: string;
  term?: string;
  session?: string;
  nextTermBegins?: string;
  portalToggles?: Record<string, boolean>;
};

export type SchoolClass = {
  id: string;
  name: string;
  locked?: boolean;
};

export type Teacher = {
  id: string;
  name: string;
  active?: boolean;
  blocked?: boolean;
  photo?: string | null;
};

export type Question = {
  qid: string;
  text: string;
  options: string[];
  answer: string;
  marks: number;
  image?: string | null;
};

export type Subject = {
  id: string;
  name: string;
  classId: string;
  questions?: { test1?: Question[]; test2?: Question[]; test3?: Question[]; exam?: Question[] };
  timeLimits?: { test1?: number; test2?: number; test3?: number; exam?: number };
};

export type Student = {
  id: string;
  name: string;
  classId: string;
  photo?: string | null;
};

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include", // browser requests: sends the school.sid cookie automatically
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : null;

  if (!res.ok) {
    throw new ApiError(body?.error || `Request failed (${res.status})`, res.status);
  }
  return body as T;
}

// Server Components run on the Next.js server, not in the browser, so
// they never automatically have the browser's session cookie. Any
// server-side data fetch that needs to be logged in has to explicitly
// forward the incoming request's cookie header along to the Express
// API — this is that plumbing.
function withCookie(cookieHeader?: string): RequestInit {
  return cookieHeader ? { headers: { Cookie: cookieHeader } } : {};
}

// For FormData bodies (photo uploads) — never set Content-Type
// manually here, the browser needs to set its own multipart boundary.
async function requestForm<T>(path: string, formData: FormData, method = "POST"): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "include",
    body: formData,
  });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : null;
  if (!res.ok) {
    throw new ApiError(body?.error || `Request failed (${res.status})`, res.status);
  }
  return body as T;
}

// For endpoints that stream back a PDF directly rather than JSON
// (ID card generation).
async function requestBlob(path: string, options: RequestInit = {}): Promise<Blob> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body?.error || message;
    } catch {}
    throw new ApiError(message, res.status);
  }
  return res.blob();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}


export const api = {
  meta: (cookieHeader?: string) => request<{ meta: SchoolMeta }>("/api/meta", withCookie(cookieHeader)),

  adminLogin: (username: string, password: string) =>
    request<{ success: boolean }>("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  adminLogout: () =>
    request<{ success: boolean }>("/api/admin/logout", { method: "POST" }),

  systemStatus: (cookieHeader?: string) =>
    request<{ locked: boolean }>("/api/system/status", withCookie(cookieHeader)),

  adminClasses: (cookieHeader?: string) =>
    request<{ classes: SchoolClass[] }>("/api/admin/classes", withCookie(cookieHeader)),

  adminTeachers: (cookieHeader?: string) =>
    request<{ teachers: Teacher[] }>("/api/admin/teachers", withCookie(cookieHeader)),

  classStudents: (classId: string, cookieHeader?: string) =>
    request<{ students: Student[] }>(
      `/api/class/${encodeURIComponent(classId)}/students`,
      withCookie(cookieHeader)
    ),

  // Admin-only variant of the above — same shape, but requires a
  // logged-in admin session (used by the students management screen).
  adminClassStudents: (classId: string, cookieHeader?: string) =>
    request<{ students: Student[] }>(
      `/api/admin/class/${encodeURIComponent(classId)}/students`,
      withCookie(cookieHeader)
    ),

  // ---- Students ----
  addStudent: (formData: FormData) =>
    requestForm<{ success: boolean; generatedPassword?: string }>("/api/admin/student", formData),

  deleteStudent: (id: string) =>
    request<{ success: boolean }>(`/api/admin/student/${encodeURIComponent(id)}`, { method: "DELETE" }),

  deleteAllStudents: () =>
    request<{ success: boolean; deleted: number }>("/api/admin/students/all", { method: "DELETE" }),

  studentIdCard: (id: string, plainPassword?: string) =>
    requestBlob(`/api/admin/idcard/${encodeURIComponent(id)}`, {
      method: "POST",
      body: JSON.stringify({ plainPassword }),
    }),

  // One combined PDF, several cards per page — for a selection that
  // may span more than one class.
  bulkStudentIdCards: (studentIds: string[]) =>
    requestBlob("/api/admin/idcards/students/bulk", {
      method: "POST",
      body: JSON.stringify({ studentIds }),
    }),

  // ---- Teachers ----
  addTeacher: (formData: FormData) =>
    requestForm<{ success: boolean; generatedPassword?: string }>("/api/admin/teacher", formData),

  deleteTeacher: (id: string) =>
    request<{ success: boolean }>(`/api/admin/teacher/${encodeURIComponent(id)}`, { method: "DELETE" }),

  deleteAllTeachers: () =>
    request<{ success: boolean; deleted: number }>("/api/admin/teachers/all", { method: "DELETE" }),

  teacherIdCard: (id: string) =>
    requestBlob(`/api/admin/teacher/${encodeURIComponent(id)}/idcard`, { method: "POST" }),

  bulkTeacherIdCards: (teacherIds: string[]) =>
    requestBlob("/api/admin/idcards/teachers/bulk", {
      method: "POST",
      body: JSON.stringify({ teacherIds }),
    }),

  toggleTeacherBlock: (id: string) =>
    request<{ success: boolean; blocked: boolean }>(
      `/api/admin/teacher/${encodeURIComponent(id)}/toggle`,
      { method: "PUT" }
    ),

  // ---- Classes ----
  addClass: (id: string, name: string, password?: string) =>
    request<{ success: boolean }>("/api/admin/class", {
      method: "POST",
      body: JSON.stringify({ id, name, password }),
    }),

  deleteClass: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/admin/class/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),

  toggleClassLock: (classId: string, locked: boolean) =>
    request<{ success: boolean; locked: boolean }>(
      `/api/admin/class/${encodeURIComponent(classId)}/lock`,
      { method: "PUT", body: JSON.stringify({ locked }) }
    ),

  // ---- Subjects ----
  subjectsByClass: (classId: string) =>
    request<{ subjects: Subject[] }>(`/api/admin/subjects?classId=${encodeURIComponent(classId)}`),

  addSubject: (id: string, name: string, classId: string) =>
    request<{ success: boolean; message: string }>("/api/admin/subject", {
      method: "POST",
      body: JSON.stringify({ id, name, classId }),
    }),

  deleteSubject: (id: string, classId: string) =>
    request<{ success: boolean; message: string }>(
      `/api/admin/subject/${encodeURIComponent(id)}/${encodeURIComponent(classId)}`,
      { method: "DELETE" }
    ),

  // ---- Bulk question upload (CSV/Excel + optional images) ----
  bulkUploadQuestions: (formData: FormData) =>
    requestForm<{
      success: boolean;
      added: number;
      skipped: number;
      imagesAttached: number;
      unmatchedImages: string[];
    }>("/api/admin/questions/bulk-upload", formData),

  // ---- Bulk student upload (CSV/Excel + optional photos) ----
  bulkUploadStudents: (formData: FormData) =>
    requestForm<{
      success: boolean;
      added: number;
      skipped: number;
      imagesAttached: number;
      unmatchedImages: string[];
      credentials: { id: string; name: string; password: string }[];
      skipReasons: string[];
    }>("/api/admin/students/bulk-upload", formData),

  // ---- Subject timings ----
  setSubjectTimings: (
    subjectId: string,
    classId: string,
    timings: { test1: number; test2: number; test3: number; exam: number }
  ) =>
    request<{ success: boolean }>("/api/admin/subject/timings", {
      method: "POST",
      body: JSON.stringify({ subjectId, classId, timings }),
    }),

  // Returns a file path (e.g. "/question-pdfs/x.pdf"), not a blob directly.
  generateQuestionsPdf: (classId: string, subjectId: string, type: string) =>
    request<{ success: boolean; file: string }>(
      `/api/admin/questions/pdf?classId=${encodeURIComponent(classId)}&subjectId=${encodeURIComponent(
        subjectId
      )}&type=${encodeURIComponent(type)}`
    ),

  deleteQuestion: (subjectId: string, qid: string, classId: string) =>
    request<{ success: boolean }>(
      `/api/admin/question/${encodeURIComponent(subjectId)}/${encodeURIComponent(qid)}/${encodeURIComponent(classId)}`,
      { method: "DELETE" }
    ),

  editQuestion: (
    subjectId: string,
    qid: string,
    classId: string,
    fields: { text?: string; options?: string; answer?: string; marks?: number }
  ) =>
    request<{ success: boolean; question: Question }>(
      `/api/admin/question/${encodeURIComponent(subjectId)}/${encodeURIComponent(qid)}/${encodeURIComponent(classId)}`,
      { method: "PUT", body: JSON.stringify(fields) }
    ),

  // Adds one question by hand — an alternative to bulk upload, for a
  // single fix or a quick add without building a whole spreadsheet.
  addQuestion: (fields: {
    subjectId: string;
    classId: string;
    type: string;
    qid: string;
    text: string;
    options: string;
    answer: string;
    marks: number;
  }) => {
    const formData = new FormData();
    Object.entries(fields).forEach(([k, v]) => formData.append(k, String(v)));
    return requestForm<{ success: boolean }>("/api/admin/question", formData);
  },

  forwardQuestions: (fromClass: string, toClass: string, subjectId: string) =>
    request<{ success: boolean }>("/api/admin/questions/forward", {
      method: "POST",
      body: JSON.stringify({ fromClass, toClass, subjectId }),
    }),

  // ---- Promote students ----
  promoteStudents: (fromClass: string, toClass: string) =>
    request<{ success: boolean; count: number }>("/api/admin/students/promote", {
      method: "POST",
      body: JSON.stringify({ fromClass, toClass }),
    }),

  // ---- Bulk receipts ----
  bulkReceipts: (classId: string, term: string, amount: string, students: { id: string; name: string }[]) =>
    requestBlob("/api/admin/receipts/bulk", {
      method: "POST",
      body: JSON.stringify({ classId, term, amount, students }),
    }),

  // ---- School settings ----
  saveSchoolInfo: (fields: {
    name?: string;
    address?: string;
    phone?: string;
    motto?: string;
    term?: string;
    session?: string;
    nextTermBegins?: string;
  }) =>
    request<{ success: boolean }>("/api/admin/school", {
      method: "POST",
      body: JSON.stringify(fields),
    }),

  uploadBranding: (type: "logo" | "principal" | "formmaster", file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    return requestForm<{ success: boolean; path: string }>(
      `/api/admin/upload?type=${type}`,
      formData
    );
  },

  // ---- Portal toggles ----
  setPortalToggle: (key: string, value: boolean) =>
    request<{ success: boolean }>("/api/admin/toggle", {
      method: "POST",
      body: JSON.stringify({ key, value }),
    }),

  // ---- Broadcast ----
  sendBroadcast: (text: string, durationSeconds: number) =>
    request<{ success: boolean }>("/api/admin/broadcast", {
      method: "POST",
      body: JSON.stringify({ text, durationSeconds }),
    }),

  // ---- Data manager (freeze/unfreeze) ----
  systemLock: () => request<{ success: boolean }>("/api/system/lock", { method: "POST" }),

  systemUnlock: (unlockPassword: string) =>
    request<{ success: boolean }>("/api/system/unlock", {
      method: "POST",
      body: JSON.stringify({ unlockPassword }),
    }),

  // ---- Account security ----
  changeAdminPassword: (currentPassword: string, newPassword: string) =>
    request<{ success: boolean }>("/api/admin/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  setUnlockPassword: (newUnlockPassword: string) =>
    request<{ success: boolean }>("/api/admin/set-unlock-password", {
      method: "POST",
      body: JSON.stringify({ newUnlockPassword }),
    }),

  // ---- Attendance ----
  classAttendance: (classId: string) =>
    request<{
      attendance: Record<
        string,
        { teacherId?: string; teacherName?: string; students: Record<string, string> }
      >;
    }>(`/api/admin/attendance/${encodeURIComponent(classId)}`),

  deleteClassAttendance: (classId: string) =>
    request<{ success: boolean; message: string }>(
      `/api/admin/attendance/${encodeURIComponent(classId)}`,
      { method: "DELETE" }
    ),

  // Each teacher's own daily attendance (did they log in that day),
  // separate from class attendance above.
  teacherAttendance: () =>
    request<{ attendance: Record<string, Record<string, string>> }>(
      "/api/admin/attendance/teachers"
    ),

  generateAttendancePdf: (classId: string, from?: string, to?: string) => {
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request<{ file: string }>(`/api/admin/attendance/class/${encodeURIComponent(classId)}/pdf${suffix}`);
  },

  generateTeacherAttendancePdf: (from?: string, to?: string) => {
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request<{ file: string }>(`/api/admin/attendance/teachers/pdf${suffix}`);
  },

  // ---- Student analytics ----
  topStudents: (classId: string) =>
    request<{ top5: { studentId: string; name: string; avg: number }[] }>(
      `/api/admin/results/top5?classId=${encodeURIComponent(classId)}`
    ),

  // ---- Report sheets ----
  // Generates one PDF per student in the class, all at once — or, if
  // studentId is given, just that one student instead of the whole class.
  generateClassReports: (classId: string, studentId?: string) =>
    request<{ success: boolean; reports: string[]; count: number; folder: string }>(
      `/api/teacher/class/${encodeURIComponent(classId)}/reports${studentId ? `?studentId=${encodeURIComponent(studentId)}` : ""}`
    ),

  // Generates one combined PDF: every student's report plus a class summary page.
  generateCombinedReport: (classId: string) =>
    request<{ success: boolean; file: string }>(
      `/api/teacher/class/${encodeURIComponent(classId)}/combined-report`
    ),

  // Deletes EVERY result in the whole school, not just generated PDF
  // files — this is a school-wide reset, not a per-class action.
  deleteAllReports: () =>
    request<{ success: boolean; resultsCleared: number; filesDeleted: number }>(
      "/api/admin/reports/all",
      { method: "DELETE" }
    ),

  // ---- Teacher portal ----
  teacherPortalLogin: (portalPassword: string) =>
    request<{ success: boolean }>("/api/portal/teacher/auth", {
      method: "POST",
      body: JSON.stringify({ portalPassword }),
    }),

  publicClasses: () => request<{ classes: SchoolClass[] }>("/api/classes"),

  teacherClassLogin: (classId: string, classPassword: string) =>
    request<{ success: boolean }>("/api/teacher/class/auth", {
      method: "POST",
      body: JSON.stringify({ classId, classPassword }),
    }),

  teacherClassSubjects: (classId: string) =>
    request<{ subjects: { id: string; name: string }[] }>(
      `/api/teacher/class/${encodeURIComponent(classId)}/subjects`
    ),

  classSubjectScores: (classId: string, subjectId: string) =>
    request<{
      students: {
        id: string;
        name: string;
        test1: number | null;
        test2: number | null;
        test3: number | null;
        exam: number | null;
      }[];
    }>(`/api/teacher/class/${encodeURIComponent(classId)}/subject/${encodeURIComponent(subjectId)}/scores`),

  saveScore: (
    classId: string,
    subjectId: string,
    studentId: string,
    field: "test1" | "test2" | "test3" | "exam",
    value: number | null
  ) =>
    request<{ success: boolean; value: number | null }>(
      `/api/teacher/class/${encodeURIComponent(classId)}/subject/${encodeURIComponent(subjectId)}/student/${encodeURIComponent(studentId)}/score`,
      { method: "PUT", body: JSON.stringify({ field, value }) }
    ),

  uploadTeacherSignature: (classId: string, file: File) => {
    const formData = new FormData();
    formData.append("signature", file);
    return requestForm<{ success: boolean; file: string; message: string }>(
      `/api/upload/teacher-signature/${encodeURIComponent(classId)}`,
      formData
    );
  },

  // ---- Test/Exam toggles ----
  getTestToggles: () =>
    request<{ testToggles: Record<"test1" | "test2" | "test3" | "exam", boolean> }>(
      "/api/admin/testToggles"
    ),

  setTestToggle: (key: "test1" | "test2" | "test3" | "exam", value: boolean) =>
    request<{ success: boolean; testToggles: Record<string, boolean> }>("/api/admin/testToggles", {
      method: "POST",
      body: JSON.stringify({ key, value }),
    }),

  // ---- Factory reset ----
  factoryReset: (confirmation: string) =>
    request<{ success: boolean }>("/api/admin/factory-reset", {
      method: "POST",
      body: JSON.stringify({ confirmation }),
    }),

  // ---- Attendance portal (a teacher's OWN id/password, separate
  // from the score-entry portal's shared portal password) ----
  attendanceTeacherLogin: (teacherId: string, password: string) =>
    request<{ success: boolean; teacher: { id: string; name: string } }>(
      "/api/attendance/teacher/login",
      { method: "POST", body: JSON.stringify({ teacherId, password }) }
    ),

  attendanceClasses: () => request<{ classes: SchoolClass[] }>("/api/attendance/classes"),

  attendanceClassStudents: (classId: string) =>
    request<{ students: { id: string; name: string }[] }>(
      `/api/attendance/class/${encodeURIComponent(classId)}/students`
    ),

  attendanceToday: (classId: string) =>
    request<{ existing: { teacherId: string; timestamp: string; students: Record<string, string> } | null }>(
      `/api/attendance/class/${encodeURIComponent(classId)}/today`
    ),

  markAttendance: (classId: string, classPassword: string, students: Record<string, "present" | "absent">) =>
    request<{ success: boolean; message: string }>("/api/attendance/mark", {
      method: "POST",
      body: JSON.stringify({ classId, classPassword, students }),
    }),

  // ---- Exam (CBT) portal ----
  examPortalLogin: (portalPassword: string) =>
    request<{ success: boolean }>("/api/portal/exam/auth", {
      method: "POST",
      body: JSON.stringify({ portalPassword }),
    }),

  examClassStudents: (classId: string) =>
    request<{ students: Student[] }>(`/api/class/${encodeURIComponent(classId)}/students`),

  verifyStudentPassword: (studentId: string, password: string) =>
    request<{ success: boolean }>("/api/exam/student/verify", {
      method: "POST",
      body: JSON.stringify({ studentId, password }),
    }),

  examClassSubjects: (classId: string) =>
    request<{ subjects: { id: string; name: string }[] }>(
      `/api/exam/class/${encodeURIComponent(classId)}/subjects`
    ),

  examQuestions: (classId: string, subjectId: string, type: string) =>
    request<{ items: Question[]; duration: number; error?: string }>(
      `/api/exam/questions?classId=${encodeURIComponent(classId)}&subjectId=${encodeURIComponent(subjectId)}&type=${encodeURIComponent(type)}`
    ),

  submitExam: (
    studentId: string,
    classId: string,
    subjectId: string,
    type: string,
    answers: Record<string, string>
  ) =>
    request<{ success: boolean; score: number; total: number; percentage: number; pdf: string | null; warning?: string }>(
      "/api/exam/submit",
      { method: "POST", body: JSON.stringify({ studentId, classId, subjectId, type, answers }) }
    ),

  // ---- Parent portal ----
  parentPortalLogin: (portalPassword: string) =>
    request<{ success: boolean }>("/api/portal/parent/auth", {
      method: "POST",
      body: JSON.stringify({ portalPassword }),
    }),

  verifyStudentId: (studentId: string) =>
    request<{ valid: boolean; student: { id: string; name: string; classId: string } }>(
      "/api/verify-student-id",
      { method: "POST", body: JSON.stringify({ studentId }) }
    ),

  parentDashboard: (studentId: string) =>
    request<{
      student: { id: string; name: string; classId: string; className: string; photo: string | null };
      average: number | null;
      pdfs: {
        tests: { filePath: string; updatedAt: string } | null;
        exam: { filePath: string; updatedAt: string } | null;
        reportSheet: { filePath: string; updatedAt: string } | null;
      };
      individualSubmissions: {
        subject: string | null;
        examType: string | null;
        filePath: string;
        timestamp: string;
      }[];
    }>(`/api/portal/parent/dashboard/${encodeURIComponent(studentId)}`),
};

export { ApiError, API_BASE };
