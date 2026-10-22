// Shared DAMS (Digital Assets Management System) types for the VBL webparts.

export type SubmissionStatus =
  | 'Pending'
  | 'InReview'
  | 'Approved'
  | 'Rejected'
  | 'NeedsEdit'
  | 'Published';

export const STATUS_VALUES: SubmissionStatus[] = [
  'Pending',
  'InReview',
  'Approved',
  'Rejected'
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
}

export interface IEditorInfo {
  Id: number;
  Email: string;
  Name: string | null;
  Jabatan: string | null;
  IsAdmin: boolean;
}

export interface IBinusianInfo {
  KodeDosen?: string | null;
  Email?: string | null;
  Name?: string | null;
  Campus?: string | null;
  AcadGroupDesc?: string | null;
  AcadOrgDesc?: string | null;
  DepartmentDesc?: string | null;
  TipeDosen?: string | null;
}

// Row returned by GET /Submissions (VideoSubmissionListDto). Nullable fields arrive as explicit null.
export interface ISubmissionListItem {
  Id: string;
  CodeNumber: string | null;
  SubmissionTime: string | null;
  Email: string | null;
  Name: string | null;
  KodeDosen: string | null;
  Fakultas: string | null;
  Jurusan: string | null;
  KodeMatakuliah: string | null;
  Topik: string | null;
  Week: string | null;
  Session: string | null;
  PicEditing: string | null;
  KualitasVideo: string | null;
  KualitasAudio: string | null;
  KualitasKonten: string | null;
  Status: string | null;
  LinkDamsShare: string | null;
  LinkVideoFromLecturer: string | null;
  // Not returned by the list endpoint yet; present only on the full record.
  FileName?: string | null;
}

// Full record returned by GET /Submissions/{id}.
export interface ISubmission extends ISubmissionListItem {
  AssetType: string | null;
  AutoNumber: number;
  Kampus: string | null;
  NamaMatakuliah: string | null;
  FileName: string | null;
  FileType: string | null;
  Category: string | null;
  Description: string | null;
  Tags: string | null;
  ButuhEdit: boolean | null;
  Qc: string | null;
  StatusAdaBumper: string | null;
  ReviewedBy: string | null;
  ReviewedAt: string | null;
  ReviewNote: string | null;
}

export interface IStatusHistory {
  Id: number;
  SubmissionId: string;
  FromStatus: string | null;
  ToStatus: string;
  ActorEmail: string;
  Note: string | null;
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
  items: ISubmissionListItem[];
}

export interface IListFilter {
  assetType?: string;
  status?: string;
  dosen?: string;
  kodeMK?: string;
  fakultas?: string;
  jurusan?: string;
  pic?: string;
  q?: string;
  assignedTo?: string;
  excludeStatus?: boolean;
  unassigned?: boolean;
  year?: number;
  page?: number;
  pageSize?: number;
  sortDir?: 'asc' | 'desc';
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

export interface ITempUploadSessionResult {
  uploadUrl: string;
  tempPath: string;
  expiresAt?: string;
}

export interface IUploadSessionRequest {
  Email: string; Name: string; KodeDosen: string;
  KodeMatakuliah: string; NamaMatakuliah: string;
  Topik: string; Description: string;
  Week: string; Session: string; JudulVideo: string;
  RumpunIlmu: string; Kampus: string; Fakultas: string; Jurusan: string; Tags: string;
  TempItemId: string;
  TempFileName: string;
}

export interface IUploadSessionResult {
  recordId: string;
  codeNumber: string;
  movedItemId?: string;
}
