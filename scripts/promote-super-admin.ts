#!/usr/bin/env tsx
/**
 * Script to promote a user to super admin
 * Usage: npm run promote-super-admin <user-email-or-id>
 */

import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq, or } from "drizzle-orm";

async function promoteSuperAdmin(userIdentifier: string) {
  try {
    console.log(`Looking for user: ${userIdentifier}`);

    // Find user by email or ID
    const [user] = await db
      .select()
      .from(users)
      .where(or(eq(users.email, userIdentifier), eq(users.id, userIdentifier)));

    if (!user) {
      console.error("❌ User not found. Please check the email or user ID.");
      process.exit(1);
    }

    console.log(
      `Found user: ${user.firstName} ${user.lastName} (${user.email})`
    );

    // Check if already super admin
    if (user.isSuperAdmin) {
      console.log("✅ User is already a super admin.");
      process.exit(0);
    }

    // Promote to super admin
    const [updatedUser] = await db
      .update(users)
      .set({
        isSuperAdmin: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();

    console.log("✅ Successfully promoted user to super admin!");
    console.log(`   Name: ${updatedUser.firstName} ${updatedUser.lastName}`);
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   User ID: ${updatedUser.id}`);
    console.log(
      "\n🎉 They can now access the /api/init route and manage the entire application."
    );
  } catch (error) {
    console.error("❌ Error promoting user to super admin:", error);
    process.exit(1);
  }
}

// Get user identifier from command line arguments
const userIdentifier = process.argv[2];

if (!userIdentifier) {
  console.log("Usage: npm run promote-super-admin <user-email-or-id>");
  console.log("Example: npm run promote-super-admin john@example.com");
  process.exit(1);
}

promoteSuperAdmin(userIdentifier);
