"use server";

import {
  DeleteFileProps,
  FileType,
  GetFilesProps,
  RenameFileProps,
  UpdateFileUsersProps,
  UploadFileProps,
} from "@/types";
import { createAdminClient } from "@/lib/appwrite";
import { InputFile } from "node-appwrite/file";
import { appwriteConfig } from "@/lib/appwrite/config";
import { ID, Models, Query } from "node-appwrite";
import { constructFileUrl, getFileType, parseStringify } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/actions/user.actions";

const handleError = (e: unknown, message: string) => {
  console.log(e + message);
  throw e;
};

export const uploadFile = async ({
  file,
  ownerId,
  accountId,
  path,
}: UploadFileProps) => {
  const { storage, database } = await createAdminClient();

  try {
    const inputFile = InputFile.fromBuffer(file, file.name);

    const bucketFile = await storage.createFile(
      appwriteConfig.bucketId,
      ID.unique(),
      inputFile,
    );

    const fileDocument = {
      type: getFileType(bucketFile.name).type,
      name: bucketFile.name,
      url: constructFileUrl(bucketFile.$id),
      extension: getFileType(bucketFile.name).extension,
      size: bucketFile.sizeOriginal,
      ownerId,
      accountId,
      users: [],
      bucketFileId: bucketFile.$id,
    };

    const newFile = database
      .createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.filesCollectId,
        ID.unique(),
        fileDocument,
      )
      .catch(async (e) => {
        await storage.deleteFile(appwriteConfig.bucketId, bucketFile.$id);
        handleError(e, "Failed to create file Document");
      });

    revalidatePath(path);
    return parseStringify(newFile);
  } catch (e) {
    handleError(e, "Failed to upload file");
  }
};

export const getFiles = async ({
  types,
  searchText = "",
  sort = "$createdAt-desc",
  limit,
}: GetFilesProps) => {
  const { database } = await createAdminClient();

  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) throw new Error("User not found");

    const queries = createQueries(currentUser, types, searchText, sort, limit);

    const files = await database.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollectId,
      queries,
    );

    return parseStringify(files);
  } catch (e) {
    handleError(e, "Failed to get files");
  }
};

const createQueries = (
  currentUser: Models.Document,
  types: string[],
  searchText: string,
  sort: string,
  limit?: number,
) => {
  const queries = [
    Query.or([
      Query.equal("ownerId", currentUser.$id),
      Query.contains("users", currentUser.email),
    ]),
  ];

  if (types.length > 0) queries.push(Query.equal("type", types));
  if (searchText.length) queries.push(Query.contains("name", searchText));
  if (limit) queries.push(Query.limit(limit));

  if (sort) {
    const [sortBy, orderBy] = sort.split("-");
    queries.push(
      orderBy === "asc" ? Query.orderAsc(sortBy) : Query.orderDesc(sortBy),
    );
  }

  return queries;
};

export const renameFile = async ({
  fileId,
  name,
  extension,
  path,
}: RenameFileProps) => {
  const { database } = await createAdminClient();

  try {
    const newName = `${name}.${extension}`;
    const updatedFile = await database.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollectId,
      fileId,
      {
        name: newName,
      },
    );

    revalidatePath(path);
    return parseStringify(updatedFile);
  } catch (e) {
    handleError(e, "Failed to rename file");
  }
};

export const updateFileUser = async ({
  fileId,
  emails,
  path,
}: UpdateFileUsersProps) => {
  const { database } = await createAdminClient();

  try {
    const updatedFile = await database.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollectId,
      fileId,
      {
        users: emails,
      },
    );

    revalidatePath(path);
    return parseStringify(updatedFile);
  } catch (e) {
    handleError(e, "Failed to Share file");
  }
};

export const deleteFile = async ({
  fileId,
  bucketFileId,
  path,
}: DeleteFileProps) => {
  const { database, storage } = await createAdminClient();

  try {
    const deleteFile = await database.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollectId,
      fileId,
    );

    if (deleteFile)
      await storage.deleteFile(appwriteConfig.bucketId, bucketFileId);
    revalidatePath(path);

    return parseStringify({ status: "success" });
  } catch (e) {
    handleError(e, "Failed to Share file");
  }
};

export const getTotalSpaceUsed = async () => {
  try {
    const { database } = await createAdminClient();
    const currentUser = await getCurrentUser();

    if (!currentUser) throw new Error("User not found");

    const files = await database.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollectId,
      [Query.equal("ownerId", [currentUser.$id])],
    );

    const totalSpace = {
      image: { size: 0, latestDate: "" },
      document: { size: 0, latestDate: "" },
      video: { size: 0, latestDate: "" },
      audio: { size: 0, latestDate: "" },
      other: { size: 0, latestDate: "" },
      used: 0,
      all: 2 * 1024 * 1024 * 1024 /* 2GB available bucket storage */,
    };

    files.documents.forEach((file) => {
      const fileType = file.type as FileType;
      totalSpace[fileType].size += file.size;
      totalSpace.used += file.size;

      if (
        !totalSpace[fileType].latestDate ||
        new Date(file.$updatedAt) > new Date(totalSpace[fileType].latestDate)
      ) {
        totalSpace[fileType].latestDate = file.$updatedAt;
      }
    });

    return parseStringify(totalSpace);
  } catch (e) {
    console.log(e);
  }
};
