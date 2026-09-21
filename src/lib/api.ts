const BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"
    ? "/api"
    : "http://localhost:3001/api");

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "An error occurred" }));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export interface UserSettings {
  appearance?: {
    darkMode?: boolean;
    reducedMotion?: boolean;
    highQualityMap?: boolean;
  };
  notifications?: {
    announcements?: boolean;
    classAlerts?: boolean;
    emergencyAlerts?: boolean;
    timetableChanges?: boolean;
  };
  accessibility?: {
    highContrast?: boolean;
    voiceNavigation?: boolean;
    autoRerouting?: boolean;
  };
  navigation?: {
    walkingSpeedMpm?: number;
    avoidStairs?: boolean;
  };
}

export interface UserProfile extends UserSettings {
  id: string;
  name: string;
  email: string;
  role: "student" | "professor" | "admin" | "guest";
  campus?: string;
  language?: string;
  department?: string;
  phone?: string;
  studentId?: string;
}

export const api = {
  // Auth & User Profile
  login: (data: any) =>
    request<{ user: UserProfile; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  register: (data: any) =>
    request<{ user: UserProfile; token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  logout: () => request<{ message: string }>("/auth/logout", { method: "POST" }),
  getMe: () => request<{ user: UserProfile }>("/auth/me"),
  updateProfile: (data: Partial<UserProfile>) =>
    request<{ user: UserProfile; message?: string }>("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  updateSettings: (data: Partial<UserSettings>) =>
    request<{ user: UserProfile; message?: string }>("/auth/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Attendance & Manual Occupancy Calculation
  recordAttendance: (data: { classroomCode: string; presentCount: number; subject?: string }) =>
    request<any>("/attendance", { method: "POST", body: JSON.stringify(data) }),
  getAttendanceLogs: () => request<any[]>("/attendance"),

  // Buildings
  getBuildings: () => request<any[]>("/buildings"),
  createBuilding: (data: any) =>
    request<any>("/buildings", { method: "POST", body: JSON.stringify(data) }),
  updateBuilding: (id: string, data: any) =>
    request<any>(`/buildings/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteBuilding: (id: string) => request<any>(`/buildings/${id}`, { method: "DELETE" }),

  // Classrooms
  getClassrooms: () => request<any[]>("/classrooms"),
  createClassroom: (data: any) =>
    request<any>("/classrooms", { method: "POST", body: JSON.stringify(data) }),
  updateClassroom: (id: string, data: any) =>
    request<any>(`/classrooms/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteClassroom: (id: string) => request<any>(`/classrooms/${id}`, { method: "DELETE" }),

  // Labs
  getLabs: () => request<any[]>("/labs"),
  createLab: (data: any) => request<any>("/labs", { method: "POST", body: JSON.stringify(data) }),
  updateLab: (id: string, data: any) =>
    request<any>(`/labs/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteLab: (id: string) => request<any>(`/labs/${id}`, { method: "DELETE" }),

  // Departments
  getDepartments: () => request<any[]>("/departments"),
  createDepartment: (data: any) =>
    request<any>("/departments", { method: "POST", body: JSON.stringify(data) }),
  updateDepartment: (id: string, data: any) =>
    request<any>(`/departments/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteDepartment: (id: string) => request<any>(`/departments/${id}`, { method: "DELETE" }),

  // Events
  getEvents: () => request<any[]>("/events"),
  createEvent: (data: any) =>
    request<any>("/events", { method: "POST", body: JSON.stringify(data) }),
  updateEvent: (id: string, data: any) =>
    request<any>(`/events/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteEvent: (id: string) => request<any>(`/events/${id}`, { method: "DELETE" }),

  // Announcements
  getAnnouncements: () => request<any[]>("/announcements"),
  createAnnouncement: (data: any) =>
    request<any>("/announcements", { method: "POST", body: JSON.stringify(data) }),
  updateAnnouncement: (id: string, data: any) =>
    request<any>(`/announcements/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteAnnouncement: (id: string) => request<any>(`/announcements/${id}`, { method: "DELETE" }),

  // Analytics
  getAnalytics: () => request<any>("/analytics/summary"),

  // Chat
  sendChatPrompt: (prompt: string) =>
    request<{ reply: string }>("/chat", { method: "POST", body: JSON.stringify({ prompt }) }),
};
