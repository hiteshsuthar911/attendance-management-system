export interface IDepartment {
  _id: string;
  name: string;
  code: string;
  description?: string;
  createdAt?: string;
}

export interface IStudentDetails {
  rollNumber?: string;
  branch?: string;
  batch?: string;
  department?: string | IDepartment;
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'faculty' | 'student';
  departments?: IDepartment[] | string[];
  studentDetails?: IStudentDetails;
  createdAt?: string;
}

export interface ISystemSummary {
  totalDepartments: number;
  totalFaculty: number;
  totalStudents: number;
  totalLectures: number;
}

export interface IAcademicProgram {
  _id: string;
  degree: string;
  branchName: string;
  branchCode: string;
  department?: IDepartment | string;
  durationYears?: number;
  sections?: string[];
  batches?: string[];
  status?: 'active' | 'inactive';
  createdAt?: string;
}

