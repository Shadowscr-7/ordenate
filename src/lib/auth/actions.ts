// ============================================================
// Auth Actions — Server Actions for Supabase Auth
// ============================================================

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const plan = (formData.get("plan") as "BASIC" | "PRO") ?? "BASIC";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Create user and default workspace in our DB
  if (data.user) {
    const user = await db.user.create({
      data: {
        email,
        name,
        authId: data.user.id,
      },
    });

    // Create default workspace with selected plan
    const workspaceName = name ? `${name}'s Workspace` : "Mi Workspace";
    await db.workspace.create({
      data: {
        name: workspaceName,
        slug: slugify(workspaceName) + "-" + user.id.slice(0, 6),
        members: {
          create: {
            userId: user.id,
            role: "OWNER",
          },
        },
        subscription: {
          create: {
            plan,
            status: "ACTIVE",
          },
        },
      },
    });
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function getSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function getCurrentUser() {
  const authUser = await getSession();
  if (!authUser) return null;

  const user = await db.user.findUnique({
    where: { authId: authUser.id },
    include: {
      memberships: {
        include: {
          workspace: {
            include: {
              subscription: true,
            },
          },
        },
      },
    },
  });

  return user;
}
