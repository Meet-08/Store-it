export type FileType = "document" | "image" | "video" | "audio" | "other";

export interface UploadFileProps {
  file: File;
  ownerId: string;
  accountId: string;
  path: string;
}

export interface SearchParamProps {
  params?: Promise<SegmentParams>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export interface ActionType {
  label: string;
  icon: string;
  value: string;
}

export interface RenameFileProps {
  fileId: string;
  name: string;
  extension: string;
  path: string;
}

export interface UpdateFileUsersProps {
  fileId: string;
  emails: string[];
  path: string;
}

export interface DeleteFileProps {
  fileId: string;
  bucketFileId: string;
  path: string;
}

export interface GetFilesProps {
  types: FileType[];
  searchText?: string;
  sort?: string;
  limit?: number;
}
