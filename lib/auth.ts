import { auth, currentUser } from "@clerk/nextjs/server";

export async function getAuthUser() {
  const { userId } = auth();
  if (!userId) {
    throw new Error("Unauthorized: Authentication required");
  }
  return { userId };
}

export async function getOptionalAuthUser() {
  const { userId } = auth();
  return userId ? { userId } : null;
}
