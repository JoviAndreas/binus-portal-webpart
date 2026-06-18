// Shared DAMS (Digital Assets Management System) types for the VBL webparts.

export type SubmissionStatus =
  | 'Pending'
  | 'InReview'
  | 'NeedsEdit'
  | 'Approved'
  | 'Rejected'
  | 'Published';

export const STATUS_VALUES: SubmissionStatus[] = [
  'Pending',
  'InReview',
  'NeedsEdit',
  'Approved',
  'Rejected',
  'Published'
];

export const BUMPER_VALUES: string[] = [
  'Ada Bumper',
  'Tidak Ada Bumper',
  'Tidak Berlaku'
];

export interface IMeInfo {
  Email: string | null;
  Name: string | null;
  IsAdmin: boolean;
  IsEditor: boolean;
  IsSupervisor: boolean;
}

export interface IEditorInfo {
  Email: string;
  Name: string;
  Jabatan: string;
}

export interface IBinusianInfo {
  KodeDosen?: string;
  Email?: string;
  Name?: string;
  Campus?: string;
  AcadGroupDesc?: string;
  AcadOrgDesc?: string;
  DepartmentDesc?: string;
  TipeDosen?: string;
}

export interface ISubmission {
  Id: string;
  AssetType?: string;
  CodeNumber?: string;
  AutoNumber?: number;
  SubmissionTime?: string;
  Email?: string;
  Name?: string;
  KodeDosen?: string;
  Kampus?: string;
  Fakultas?: string;
  Jurusan?: string;
  KodeMatakuliah?: string;
  NamaMatakuliah?: string;
  Topik?: string;
  Week?: string;
  Session?: string;
  FileName?: string;
  FileType?: string;
  Category?: string;
  Description?: string;
  Tags?: string;
  LinkDamsShare?: string;
  LinkVideoFromLecturer?: string;
  ButuhEdit?: boolean;
  PicEditing?: string;
  Qc?: string;
  StatusAdaBumper?: string;
  KualitasVideo?: string;
  KualitasAudio?: string;
  KualitasKonten?: string;
  Status?: SubmissionStatus;
  ReviewedBy?: string;
  ReviewedAt?: string;
  ReviewNote?: string;
}

export interface IStatusHistory {
  Id: number;
  SubmissionId: string;
  FromStatus?: string;
  ToStatus: string;
  ActorEmail: string;
  Note?: string;
  At: string;
}

export interface ISubmissionPatch {
  Status?: string;
  PicEditing?: string;
  Qc?: string;
  ButuhEdit?: boolean;
  StatusAdaBumper?: string;
  KualitasVideo?: string;
  KualitasAudio?: string;
  KualitasKonten?: string;
  ReviewNote?: string;
  NamaMatakuliah?: string;
  Topik?: string;
  Description?: string;
  Tags?: string;
}

export interface IBulkPatch {
  ids: string[];
  patch: ISubmissionPatch;
}

export interface IListResult {
  total: number;
  page: number;
  pageSize: number;
  items: ISubmission[];
}

export interface IListFilter {
  assetType?: string;
  status?: string;
  dosen?: string;
  kodeMK?: string;
  jurusan?: string;
  pic?: string;
  q?: string;
  assignedTo?: string;
  excludeStatus?: boolean;
  unassigned?: boolean;
  year?: number;
  page?: number;
  pageSize?: number;
}

export interface IAutofill {
  found: boolean;
  email: string;
  name: string;
  kodeDosen: string;
  kampus: string;
  fakultas: string;
  jurusan: string;
}
