"use server";

import { UploadFileProps } from "@/types";
import { createAdminClient } from "@/lib/appwrite";
import { InputFile } from "node-appwrite/file";
import { appwriteConfig } from "@/lib/appwrite/config";
import { ID } from "node-appwrite";
import { constructFileUrl, getFileType, parseStringify } from "@/lib/utils";
import { revalidatePath } from "next/cache";

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

const handleError = (e: unknown, message: string) => {
  console.log(e);
  throw e;
};
