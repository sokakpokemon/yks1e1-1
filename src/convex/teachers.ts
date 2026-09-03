import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";

/** Teachers of the signed-in course, most recently used first. */
export const listTeachers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    return ctx.db
      .query("teachers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});
