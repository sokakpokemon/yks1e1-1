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
    className: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Giriş yapılmamış.");

    const studentName = args.studentName.trim();
    const subject = args.subject.trim();
    const missingTopic = args.missingTopic.trim();
    const teacherName = args.teacherName.trim();
    const className = (args.className ?? "").trim();

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
      className,
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

/** Moves a lesson to another date/time slot (drag & drop inside timetables). */
export const moveLesson = mutation({
  args: {
    id: v.id("lessons"),
    date: v.string(),
    time: v.string(),
    teacherName: v.optional(v.string()),
    className: v.optional(v.string()),
  },
  handler: async (ctx, { id, date, time, teacherName, className }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Giriş yapılmamış.");
    const lesson = await ctx.db.get(id);
    if (lesson === null || lesson.userId !== userId) {
      throw new Error("Ders bulunamadı.");
    }
    if (date === "" || time === "") throw new Error("Hedef saat geçersiz.");
    const patch: Record<string, string> = { date, time };
    const nextTeacher = (teacherName ?? "").trim();
    if (nextTeacher) patch.teacherName = nextTeacher;
    const nextClass = (className ?? "").trim();
    if (nextClass) patch.className = nextClass;
    await ctx.db.patch(id, patch);
  },
});

/* ------------------------------------------------------------------ */
/* Sınıf / grup dersleri (class lessons, shown on class timetables)     */
/* ------------------------------------------------------------------ */

export const upsertClassLesson = mutation({
  args: {
    id: v.optional(v.id("classLessons")),
    className: v.string(),
    subject: v.string(),
    teacherName: v.string(),
    date: v.string(),
    time: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Giriş yapılmamış.");

    const className = args.className.trim();
    const subject = args.subject.trim();
    const teacherName = args.teacherName.trim();
    if (!className) throw new Error("Sınıf seçilmedi.");
    if (!subject) throw new Error("Ders seçilmedi.");
    if (!teacherName) throw new Error("Öğretmen seçilmedi.");
    if (!args.date || !args.time) throw new Error("Gün/saat seçilmedi.");

    // Register the teacher if they are new to this course.
    const teachers = await ctx.db
      .query("teachers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const known = teachers.some(
      (t) => t.name.trim().toLocaleLowerCase("tr") === teacherName.toLocaleLowerCase("tr"),
    );
    if (!known) {
      await ctx.db.insert("teachers", { userId, name: teacherName });
    }

    if (args.id !== undefined) {
      const existing = await ctx.db.get(args.id);
      if (existing === null || existing.userId !== userId) {
        throw new Error("Sınıf dersi bulunamadı.");
      }
      await ctx.db.patch(args.id, {
        className,
        subject,
        teacherName,
        date: args.date,
        time: args.time,
      });
      return { id: args.id };
    }

    const id = await ctx.db.insert("classLessons", {
      userId,
      className,
      subject,
      teacherName,
      date: args.date,
      time: args.time,
    });
    return { id };
  },
});

/** All class lessons of the signed-in course. */
export const listClassLessons = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    return ctx.db
      .query("classLessons")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const deleteClassLesson = mutation({
  args: { id: v.id("classLessons") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Giriş yapılmamış.");
    const row = await ctx.db.get(id);
    if (row === null || row.userId !== userId) {
      throw new Error("Sınıf dersi bulunamadı.");
    }
    await ctx.db.delete(id);
  },
});

/* ------------------------------------------------------------------ */
/* Sınıf listesi (classes/grups) — server side                          */
/* ------------------------------------------------------------------ */

export const listClasses = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    return ctx.db
      .query("classes")
      .withIndex("by_user_name", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const upsertClass = mutation({
  args: {
    id: v.optional(v.id("classes")),
    name: v.string(),
  },
  handler: async (ctx, { id, name }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Giriş yapılmamış.");
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Sınıf adı boş olamaz.");
    const all = await ctx.db
      .query("classes")
      .withIndex("by_user_name", (q) => q.eq("userId", userId))
      .collect();
    const dup = all.some(
      (c) =>
        c._id !== id &&
        c.name.trim().toLocaleLowerCase("tr") === trimmed.toLocaleLowerCase("tr"),
    );
    if (dup) throw new Error("Bu sınıf adı zaten kayıtlı.");
    if (id !== undefined) {
      const existing = await ctx.db.get(id);
      if (existing === null || existing.userId !== userId) {
        throw new Error("Sınıf bulunamadı.");
      }
      await ctx.db.patch(id, { name: trimmed });
      return { id };
    }
    const newId = await ctx.db.insert("classes", { userId, name: trimmed });
    return { id: newId };
  },
});

export const deleteClass = mutation({
  args: { id: v.id("classes") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Giriş yapılmamış.");
    const row = await ctx.db.get(id);
    if (row === null || row.userId !== userId) {
      throw new Error("Sınıf bulunamadı.");
    }
    await ctx.db.delete(id);
  },
});

/* ------------------------------------------------------------------ */
/* Öğrenci listesi — server side                                       */
/* ------------------------------------------------------------------ */

export const listStudents = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    return ctx.db
      .query("students")
      .withIndex("by_user_name", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const upsertStudent = mutation({
  args: {
    id: v.optional(v.id("students")),
    name: v.string(),
    className: v.optional(v.string()),
  },
  handler: async (ctx, { id, name, className }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Giriş yapılmamış.");
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Öğrenci adı boş olamaz.");
    if (id !== undefined) {
      const existing = await ctx.db.get(id);
      if (existing === null || existing.userId !== userId) {
        throw new Error("Öğrenci bulunamadı.");
      }
      await ctx.db.patch(id, {
        name: trimmed,
        className: (className ?? "").trim(),
      });
      return { id };
    }
    const newId = await ctx.db.insert("students", {
      userId,
      name: trimmed,
      className: (className ?? "").trim(),
    });
    return { id: newId };
  },
});

export const deleteStudent = mutation({
  args: { id: v.id("students") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Giriş yapılmamış.");
    const row = await ctx.db.get(id);
    if (row === null || row.userId !== userId) {
      throw new Error("Öğrenci bulunamadı.");
    }
    await ctx.db.delete(id);
  },
});

/* ------------------------------------------------------------------ */
/* Extra lessons (ek ders) — teacher one-to-one calendar overlay        */
/* ------------------------------------------------------------------ */

export const upsertExtraLesson = mutation({
  args: {
    id: v.optional(v.id("extraLessons")),
    title: v.string(),
    teacherName: v.string(),
    className: v.string(),
    date: v.string(),
    time: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Giriş yapılmamış.");

    const title = args.title.trim();
    const teacherName = args.teacherName.trim();
    const className = args.className.trim();
    if (!title) throw new Error("Ek ders adı boş olamaz.");
    if (!teacherName) throw new Error("Öğretmen seçilmedi.");
    if (!className) throw new Error("Sınıf seçilmedi.");
    if (!args.date || !args.time) throw new Error("Gün/saat seçilmedi.");

    if (args.id !== undefined) {
      const existing = await ctx.db.get(args.id);
      if (existing === null || existing.userId !== userId) {
        throw new Error("Ek ders bulunamadı.");
      }
      await ctx.db.patch(args.id, {
        title,
        teacherName,
        className,
        date: args.date,
        time: args.time,
      });
      return { id: args.id };
    }

    const id = await ctx.db.insert("extraLessons", {
      userId,
      title,
      teacherName,
      className,
      date: args.date,
      time: args.time,
    });
    return { id };
  },
});

/** All extra lessons (ek ders) of the signed-in course. */
export const listExtraLessons = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    return ctx.db
      .query("extraLessons")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const deleteExtraLesson = mutation({
  args: { id: v.id("extraLessons") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Giriş yapılmamış.");
    const row = await ctx.db.get(id);
    if (row === null || row.userId !== userId) {
      throw new Error("Ek ders bulunamadı.");
    }
    await ctx.db.delete(id);
  },
});

/* ------------------------------------------------------------------ */
/* Seeding                                                             */
/* ------------------------------------------------------------------ */

const pad = (n: number) => String(n).padStart(2, "0");

function toYmd(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/**
 * Idempotently adds the course's default class groups and teachers (by name)
 * when they are missing. Safe to call any time; used to top up existing
 * accounts created before the real roster existed.
 */
export const ensureRosterDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return { added: 0 };

    const classNames = [
      "MEZUN SAY 1", "MEZUN SAY 2", "MEZUN SAY 3", "MEZUN EA 1", "MEZUN EA 2",
      "12 SAY 1", "12 SAY 2", "12 SAY CAL", "12 EA 1", "12 DİL",
      "11 SAY 1", "11 SAY 2", "11 SAY 3", "11 SAY CAL", "11 SAYISAL FEN", "11 EA 1",
      "10.SINIF", "9.SINIF",
    ];
    const teacherNames = [
      "SONER AÇIKGÖZ", "MEHMET ŞAŞAR", "TAHSİN ASLAN", "MİNE GÜRKAN",
      "MUSTAFA GÜRKAN", "RAVİDE DERYA", "BELGİN ÇOLAK", "KARDELEN ASLAN",
      "ŞAHİN DOĞANAY", "EREN BİLGİLİ", "FATMA KURT", "FİKRİYE KIYAR",
      "NİHAT KANARIG", "MERT ASİL", "SALİM URTİMUR", "MERVE GEREK", "SELİNA KUTLU",
    ];

    const classes = await ctx.db
      .query("classes")
      .withIndex("by_user_name", (q) => q.eq("userId", userId))
      .collect();
    const teachers = await ctx.db
      .query("teachers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const knownClasses = new Set(
      classes.map((c) => c.name.trim().toLocaleUpperCase("tr")),
    );
    const knownTeachers = new Set(
      teachers.map((t) => t.name.trim().toLocaleUpperCase("tr")),
    );

    let added = 0;
    for (const name of classNames) {
      if (!knownClasses.has(name.toLocaleUpperCase("tr"))) {
        await ctx.db.insert("classes", { userId, name });
        added++;
      }
    }
    for (const name of teacherNames) {
      if (!knownTeachers.has(name.toLocaleUpperCase("tr"))) {
        await ctx.db.insert("teachers", { userId, name });
        added++;
      }
    }
    return { added };
  },
});

/**
 * Seeds the course's real starter dataset: classes, teachers (with branch
 * mapping done client-side), a few sample lessons, plus one class lesson and
 * one extra lesson so all timetable views have content immediately.
 * Runs at most once per user (`users.sampleDataLoaded` acts as a lock).
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
    const classes = await ctx.db
      .query("classes")
      .withIndex("by_user_name", (q) => q.eq("userId", userId))
      .collect();
    if (lessons.length > 0 || classes.length > 0) {
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

    // Real roster: classes + teachers (uppercase, as provided by the kurs).
    const classNames = [
      "MEZUN SAY 1", "MEZUN SAY 2", "MEZUN SAY 3", "MEZUN EA 1", "MEZUN EA 2",
      "12 SAY 1", "12 SAY 2", "12 SAY CAL", "12 EA 1", "12 DİL",
      "11 SAY 1", "11 SAY 2", "11 SAY 3", "11 SAY CAL", "11 SAYISAL FEN", "11 EA 1",
      "10.SINIF", "9.SINIF",
    ];
    for (const name of classNames) {
      await ctx.db.insert("classes", { userId, name });
    }

    const teacherNames = [
      "SONER AÇIKGÖZ", "MEHMET ŞAŞAR", "TAHSİN ASLAN", "MİNE GÜRKAN",
      "MUSTAFA GÜRKAN", "RAVİDE DERYA", "BELGİN ÇOLAK", "KARDELEN ASLAN",
      "ŞAHİN DOĞANAY", "EREN BİLGİLİ", "FATMA KURT", "FİKRİYE KIYAR",
      "NİHAT KANARIG", "MERT ASİL", "SALİM URTİMUR", "MERVE GEREK", "SELİNA KUTLU",
    ];
    for (const name of teacherNames) {
      await ensureTeacher(name);
    }

    const [year, month, day] = today.split("-").map(Number);
    const base = Date.UTC(year, month - 1, day);
    const mondayOffset = (new Date(base).getUTCDay() + 6) % 7;
    const monday = new Date(base - mondayOffset * 86_400_000);
    const ymdOfOffset = (offset: number) =>
      toYmd(new Date(monday.getTime() + offset * 86_400_000));

    // A few one-to-one (birebir) samples on Mon/Tue/Wed.
    const samples: Array<{
      studentName: string;
      subject: string;
      missingTopic: string;
      teacherName: string;
      dayOffset: number;
      time: string;
      className: string;
    }> = [
      {
        studentName: "Ayşe Demir",
        subject: "MATEMATİK",
        missingTopic: "Sayılar",
        teacherName: "SONER AÇIKGÖZ",
        dayOffset: 0,
        time: "08:50",
        className: "MEZUN SAY 1",
      },
      {
        studentName: "Ecrin Şahin",
        subject: "TÜRKÇE",
        missingTopic: "Paragraf",
        teacherName: "EREN BİLGİLİ",
        dayOffset: 1,
        time: "13:00",
        className: "12 EA 1",
      },
      {
        studentName: "Mert Yılmaz",
        subject: "FİZİK",
        missingTopic: "Hareket",
        teacherName: "MUSTAFA GÜRKAN",
        dayOffset: 2,
        time: "15:30",
        className: "11 SAY 1",
      },
    ];
    for (const s of samples) {
      await ctx.db.insert("lessons", {
        userId,
        studentName: s.studentName,
        subject: s.subject,
        missingTopic: s.missingTopic,
        teacherName: s.teacherName,
        date: ymdOfOffset(s.dayOffset),
        time: s.time,
        status: "planned",
        className: s.className,
      });
    }

    // Class lessons so the sınıf programı shows badges.
    await ctx.db.insert("classLessons", {
      userId,
      className: "MEZUN SAY 1",
      subject: "MATEMATİK",
      teacherName: "SONER AÇIKGÖZ",
      date: ymdOfOffset(0),
      time: "09:40",
    });
    await ctx.db.insert("classLessons", {
      userId,
      className: "12 EA 1",
      subject: "TÜRKÇE",
      teacherName: "EREN BİLGİLİ",
      date: ymdOfOffset(1),
      time: "10:30",
    });

    // One ek ders sample on the teacher one-to-one view.
    await ctx.db.insert("extraLessons", {
      userId,
      title: "Deneme Analiz Ek Dersi",
      teacherName: "SALİM URTİMUR",
      className: "MEZUN SAY 2",
      date: ymdOfOffset(2),
      time: "16:20",
    });

    await ctx.db.patch(userId, { sampleDataLoaded: true });
    return { seeded: true };
  },
});
