import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const lessonStatus = v.union(
  v.literal("planned"),
  v.literal("completed"),
  v.literal("cancelled"),
);

/** All lessons of the signed-in course (sorted by date inside the query). */
export const listLessons = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    return ctx.db
      .query("lessons")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .collect();
  },
});

/** A single lesson, used for the undo-delete flow. */
export const getLesson = query({
  args: { id: v.id("lessons") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const lesson = await ctx.db.get(id);
    if (lesson === null || lesson.userId !== userId) return null;
    return lesson;
  },
});

/**
 * Plans a new birebir lesson. Also registers the teacher (by name) in the
 * course's teacher list so "Hızlı öğretmen" pills stay in sync.
 */
export const planLesson = mutation({
  args: {
    studentName: v.string(),
    subject: v.string(),
    missingTopic: v.string(),
    teacherName: v.string(),
    date: v.string(),
    time: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Giriş yapılmamış.");

    const studentName = args.studentName.trim();
    const subject = args.subject.trim();
    const missingTopic = args.missingTopic.trim();
    const teacherName = args.teacherName.trim();

    if (studentName === "") throw new Error("Öğrenci adı boş olamaz.");
    if (subject === "") throw new Error("Ders seçilmedi.");
    if (teacherName === "") throw new Error("Öğretmen adı boş olamaz.");
    if (args.date === "") throw new Error("Tarih seçilmedi.");
    if (args.time === "") throw new Error("Saat seçilmedi.");

    // Register the teacher if they are new to this course.
    const existing = await ctx.db
      .query("teachers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const known = existing.some(
      (t) => t.name.trim().toLocaleLowerCase("tr") === teacherName.toLocaleLowerCase("tr"),
    );
    if (!known) {
      await ctx.db.insert("teachers", { userId, name: teacherName });
    }

    const lessonId = await ctx.db.insert("lessons", {
      userId,
      studentName,
      subject,
      missingTopic,
      teacherName,
      date: args.date,
      time: args.time,
      status: "planned",
    });

    return { lessonId };
  },
});

export const setLessonStatus = mutation({
  args: { id: v.id("lessons"), status: lessonStatus },
  handler: async (ctx, { id, status }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Giriş yapılmamış.");
    const lesson = await ctx.db.get(id);
    if (lesson === null || lesson.userId !== userId) {
      throw new Error("Ders bulunamadı.");
    }
    await ctx.db.patch(id, { status });
  },
});

export const deleteLesson = mutation({
  args: { id: v.id("lessons") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Giriş yapılmamış.");
    const lesson = await ctx.db.get(id);
    if (lesson === null || lesson.userId !== userId) {
      throw new Error("Ders bulunamadı.");
    }
    await ctx.db.delete(id);
  },
});

const pad = (n: number) => String(n).padStart(2, "0");

function toYmd(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/**
 * Seeds a small, realistic demo dataset for a brand new course so the
 * dashboard opens with meaningful content. Runs at most once per user
 * (`users.sampleDataLoaded` acts as a server-side lock; concurrent calls
 * conflict on that document and retry, so duplicates are prevented).
 * The two sample lessons are placed on Tuesday/Wednesday of the current week
 * (the client passes its local "today" as YYYY-MM-DD).
 */
export const ensureSampleData = mutation({
  args: { today: v.string() },
  handler: async (ctx, { today }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Giriş yapılmamış.");

    const user = await ctx.db.get(userId);
    if (user?.sampleDataLoaded) return { seeded: false };

    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .collect();
    if (lessons.length > 0) {
      await ctx.db.patch(userId, { sampleDataLoaded: true });
      return { seeded: false };
    }

    const teachers = await ctx.db
      .query("teachers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const knownNames = new Set(
      teachers.map((t) => t.name.trim().toLocaleLowerCase("tr")),
    );
    const ensureTeacher = async (name: string) => {
      const key = name.trim().toLocaleLowerCase("tr");
      if (!knownNames.has(key)) {
        await ctx.db.insert("teachers", { userId, name });
        knownNames.add(key);
      }
    };

    await ensureTeacher("Soner Açıkgöz");
    await ensureTeacher("mert hoca");

    const [year, month, day] = today.split("-").map(Number);
    const base = Date.UTC(year, month - 1, day);
    // Monday as week start (Monday = 0)
    const mondayOffset = (new Date(base).getUTCDay() + 6) % 7;
    const monday = new Date(base - mondayOffset * 86_400_000);

    const tuesday = new Date(monday.getTime() + 86_400_000);
    const wednesday = new Date(monday.getTime() + 2 * 86_400_000);

    await ctx.db.insert("lessons", {
      userId,
      studentName: "Ayşe Demir",
      subject: "Matematik",
      missingTopic: "Sayılar",
      teacherName: "Soner Açıkgöz",
      date: toYmd(tuesday),
      time: "16:00",
      status: "planned",
    });
    await ctx.db.insert("lessons", {
      userId,
      studentName: "Ecrin Şahin",
      subject: "Türkçe",
      missingTopic: "Paragraf",
      teacherName: "mert hoca",
      date: toYmd(wednesday),
      time: "14:00",
      status: "planned",
    });

    await ctx.db.patch(userId, { sampleDataLoaded: true });
    return { seeded: true };
  },
});
