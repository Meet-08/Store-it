"use server";

import { createAdminClient, createSessionClient } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";
import { ID, Query } from "node-appwrite";
import { parseStringify } from "@/lib/utils";
import { cookies } from "next/headers";
import { avatarPlaceHolderUrl } from "@/constants";
import { redirect } from "next/navigation";

const getUserByEmail = async (email: string) => {
  const { database } = await createAdminClient();

  const result = await database.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.usersCollectionId,
    [Query.equal("email", email)],
  );

  return result.total > 0 ? result.documents[0] : null;
};

const handleError = (e: unknown, message: string) => {
  console.log(e + message);
};

export const sendEmailOTP = async ({ email }: { email: string }) => {
  const { account } = await createAdminClient();
  try {
    const session = await account.createEmailToken(ID.unique(), email);
    return session.userId;
  } catch (e) {
    handleError(e, "Failed to Send email otp");
  }
};
export const createAccount = async ({
  fullName,
  email,
}: {
  fullName: string;
  email: string;
}) => {
  const existingUser = await getUserByEmail(email);

  const accountId = await sendEmailOTP({ email });

  try {
    if (!accountId) throw new Error("Failed to send an OTP");

    if (!existingUser) {
      const { database } = await createAdminClient();

      await database.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        ID.unique(),
        {
          fullName,
          email,
          avatar: avatarPlaceHolderUrl,
          accountId,
        },
      );
    }
    return parseStringify({ accountId });
  } catch (e) {
    handleError(e, "Failed to create account");
  }
};

export const verifySecret = async ({
  accountId,
  password,
  type,
}: {
  accountId: string;
  password: string;
  type: string;
}) => {
  try {
    const { account } = await createAdminClient();

    const session = await account.createSession(accountId, password);

    (await cookies()).set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return parseStringify({ sessionId: session.$id });
  } catch (e) {
    handleError(e, "Failed to verify OTP");
  }
};

export const getCurrentUser = async () => {
  try {
    const { account, database } = await createSessionClient();

    const result = await account.get();

    const user = await database.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      [Query.equal("accountId", result.$id)],
    );

    if (user.total <= 0) return null;

    return parseStringify(user.documents[0]);
  } catch (e) {
    console.log(e);
    return null;
  }
};

export const signOutUser = async () => {
  const { account } = await createSessionClient();

  try {
    await account.deleteSessions();
    (await cookies()).delete("appwrite-session");
  } catch (e) {
    handleError(e, "Failed to sign out user");
  } finally {
    redirect("/sign-in");
  }
};

export const signInUser = async ({ email }: { email: string }) => {
  try {
    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      await sendEmailOTP({ email });
      return parseStringify({ accountId: existingUser.accountId });
    }

    return parseStringify({ accountId: null, error: "User not found" });
  } catch (e) {
    handleError(e, "Failed to sign in user");
  }
};
