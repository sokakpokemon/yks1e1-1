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
    term: v.optional(v.string()), // "2026/2027" — sınıf listeleri dönem bazlıdır
  },
  handler: async (ctx, { id, name, term }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Giriş yapılmamış.");
    const trimmed = name.trim();
    const termKey = (term ?? "").trim();
    if (!trimmed) throw new Error("Sınıf adı boş olamaz.");
    const all = await ctx.db
      .query("classes")
      .withIndex("by_user_name", (q) => q.eq("userId", userId))
      .collect();
    const dup = all.some(
      (c) =>
        c._id !== id &&
        (termKey === "" || normalizeTerm(c.term ?? "") === normalizeTerm(termKey)) &&
        c.name.trim().toLocaleLowerCase("tr") === trimmed.toLocaleLowerCase("tr"),
    );
    if (dup) throw new Error("Bu sınıf adı bu dönemde zaten kayıtlı.");
    if (id !== undefined) {
      const existing = await ctx.db.get(id);
      if (existing === null || existing.userId !== userId) {
        throw new Error("Sınıf bulunamadı.");
      }
      await ctx.db.patch(id, { name: trimmed, term: normalizeTerm(termKey) });
      return { id };
    }
    const newId = await ctx.db.insert("classes", {
      userId,
      name: trimmed,
      term: normalizeTerm(termKey),
    });
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
    term: v.optional(v.string()), // "2026/2027" — öğrenci listeleri dönem bazlıdır
  },
  handler: async (ctx, { id, name, className, term }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Giriş yapılmamış.");
    const trimmed = name.trim();
    const termKey = (term ?? "").trim();
    if (!trimmed) throw new Error("Öğrenci adı boş olamaz.");
    const all = await ctx.db
      .query("students")
      .withIndex("by_user_name", (q) => q.eq("userId", userId))
      .collect();
    const dup = all.some(
      (s) =>
        s._id !== id &&
        (termKey === "" || normalizeTerm(s.term ?? "") === normalizeTerm(termKey)) &&
        s.name.trim().toLocaleLowerCase("tr") === trimmed.toLocaleLowerCase("tr"),
    );
    if (dup) throw new Error("Bu öğrenci bu dönemde zaten kayıtlı.");
    if (id !== undefined) {
      const existing = await ctx.db.get(id);
      if (existing === null || existing.userId !== userId) {
        throw new Error("Öğrenci bulunamadı.");
      }
      await ctx.db.patch(id, {
        name: trimmed,
        className: (className ?? "").trim(),
        term: normalizeTerm(termKey),
      });
      return { id };
    }
    const newId = await ctx.db.insert("students", {
      userId,
      name: trimmed,
      className: (className ?? "").trim(),
      term: normalizeTerm(termKey),
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
/* Sınıf ek dersleri (esnek — haftalık/günlük planlanır)                */
/* ------------------------------------------------------------------ */

/** All flexible class extra lessons, pooled or scheduled. */
export const listClassExtraLessons = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    return ctx.db
      .query("classExtraLessons")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .collect();
  },
});

/**
 * Creates a flexible class extra lesson request. When scheduledDate is empty
 * the request stays in the pool; otherwise it is already placed.
 */
export const createClassExtraLesson = mutation({
  args: {
    className: v.string(),
    subject: v.string(),
    teacherName: v.string(),
    topic: v.string(),
    scheduledDate: v.string(), // "" = pool
    scheduledTime: v.string(),
    term: v.optional(v.string()), // "2026/2027"
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Giriş yapılmamış.");

    const className = args.className.trim();
    const subject = args.subject.trim();
    const teacherName = args.teacherName.trim();
    const topic = args.topic.trim();
    const term = (args.term ?? "").trim();
    if (!className) throw new Error("Sınıf seçilmedi.");
    if (!subject) throw new Error("Ders seçilmedi.");
    if (!teacherName) throw new Error("Öğretmen seçilmedi.");
    if (!topic) throw new Error("Anlatılacak konu boş olamaz.");

    // Register the teacher if they are new to this course.
    const teachers = await ctx.db
      .query("teachers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const known = teachers.some(
      (t) =>
        t.name.trim().toLocaleLowerCase("tr") === teacherName.toLocaleLowerCase("tr"),
    );
    if (!known) {
      await ctx.db.insert("teachers", { userId, name: teacherName });
    }

    const id = await ctx.db.insert("classExtraLessons", {
      userId,
      className,
      subject,
      teacherName,
      topic,
      date: args.scheduledDate,
      time: args.scheduledTime,
      term,
    });
    return { id };
  },
});

/** "2026-09-05" -> "2026/2027" (Sep starts the new term). */
function termFromYmd(ymd: string): string {
  if (!ymd) return "";
  const [yRaw, mRaw] = ymd.split("-");
  const y = Number(yRaw);
  const month = Number(mRaw);
  if (!y || !month) return "";
  if (month >= 9) return `${y}/${y + 1}`;
  return `${y - 1}/${y}`;
}

/**
 * Normalizes any stored term label to the full "YYYY/YYYY" form so that
 * legacy "2026/27" rows still match the current "2026/2027" selectors.
 */
function normalizeTerm(term: string): string {
  if (!term) return "";
  const m = term.trim().match(/^(\d{4})\/(\d{2,4})$/);
  if (!m) return term.trim();
  const start = Number(m[1]);
  let end = Number(m[2]);
  if (m[2].length === 2) end = start + (end === (start + 1) % 100 ? 1 : 0);
  return `${start}/${end}`;
}

/** Moves (or removes from) the calendar a flexible class extra lesson. */
export const moveClassExtraLesson = mutation({
  args: {
    id: v.id("classExtraLessons"),
    date: v.string(), // "" returns the lesson to the pool
    time: v.string(),
  },
  handler: async (ctx, { id, date, time }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Giriş yapılmamış.");
    const row = await ctx.db.get(id);
    if (row === null || row.userId !== userId) {
      throw new Error("Sınıf ek dersi bulunamadı.");
    }
    if (date !== "" && time === "") throw new Error("Saat geçersiz.");
    const patch: Record<string, string> = { date, time };
    // Havuza geri alınırken dönemi koru; yerleşirken tarihten türet.
    if (date !== "") {
      const term = termFromYmd(date);
      if (term) patch.term = term;
    }
    await ctx.db.patch(id, patch);
  },
});

export const deleteClassExtraLesson = mutation({
  args: { id: v.id("classExtraLessons") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Giriş yapılmamış.");
    const row = await ctx.db.get(id);
    if (row === null || row.userId !== userId) {
      throw new Error("Sınıf ek dersi bulunamadı.");
    }
    await ctx.db.delete(id);
  },
});

/* ------------------------------------------------------------------ */
/* Sınıf (Grup) Ek Ders — bağımsız bölüm (öğretmen takvimine birebir gibi) */
/* ------------------------------------------------------------------ */

/** All class-group extra lessons (pooled or scheduled) of the course. */
export const listClassGroupExtraLessons = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    return ctx.db
      .query("classGroupExtraLessons")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .collect();
  },
});

/** Creates a Sınıf (Grup) Ek Ders request (pool or pre-scheduled). */
export const createClassGroupExtraLesson = mutation({
  args: {
    term: v.string(),
    className: v.string(),
    subject: v.string(),
    teacherName: v.string(),
    topic: v.string(),
    scheduledDate: v.string(), // "" = pool
    scheduledTime: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Giriş yapılmamış.");

    const term = normalizeTerm(args.term.trim());
    const className = args.className.trim();
    const subject = args.subject.trim();
    const teacherName = args.teacherName.trim();
    const topic = args.topic.trim();
    if (!term) throw new Error("Dönem belirtilmedi.");
    if (!className) throw new Error("Sınıf seçilmedi.");
    if (!subject) throw new Error("Ders seçilmedi.");
    if (!teacherName) throw new Error("Öğretmen seçilmedi.");
    if (!topic) throw new Error("Anlatılacak konu boş olamaz.");

    // Register the teacher if they are new to this course.
    const teachers = await ctx.db
      .query("teachers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const known = teachers.some(
      (t) =>
        t.name.trim().toLocaleLowerCase("tr") === teacherName.toLocaleLowerCase("tr"),
    );
    if (!known) {
      await ctx.db.insert("teachers", { userId, name: teacherName });
    }

    const id = await ctx.db.insert("classGroupExtraLessons", {
      userId,
      term,
      className,
      subject,
      teacherName,
      topic,
      date: args.scheduledDate,
      time: args.scheduledTime,
    });
    return { id };
  },
});

/** Moves (or returns to the pool) a class-group extra lesson. */
export const moveClassGroupExtraLesson = mutation({
  args: {
    id: v.id("classGroupExtraLessons"),
    date: v.string(),
    time: v.string(),
  },
  handler: async (ctx, { id, date, time }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Giriş yapılmamış.");
    const row = await ctx.db.get(id);
    if (row === null || row.userId !== userId) {
      throw new Error("Sınıf ek dersi bulunamadı.");
    }
    if (date !== "" && time === "") throw new Error("Saat geçersiz.");
    const patch: Record<string, string> = { date, time };
    if (date !== "") {
      const derived = termFromYmd(date);
      if (derived) patch.term = derived;
    }
    await ctx.db.patch(id, patch);
  },
});

export const deleteClassGroupExtraLesson = mutation({
  args: { id: v.id("classGroupExtraLessons") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Giriş yapılmamış.");
    const row = await ctx.db.get(id);
    if (row === null || row.userId !== userId) {
      throw new Error("Sınıf ek dersi bulunamadı.");
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
 * Idempotently adds the course's default class groups and teachers when they
 * are missing. The dönem is derived from the server's current date (used by
 * first-run seeding and legacy top-up).
 */
export const ensureRosterDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return { added: 0 };
    const termKey = termFromYmd(toYmd(new Date())).trim();
    if (!termKey) return { added: 0 };

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
    const knownClassesInTerm = new Set(
      classes
        .filter((c) => normalizeTerm(c.term ?? "") === normalizeTerm(termKey))
        .map((c) => c.name.trim().toLocaleUpperCase("tr")),
    );
    const knownTeachers = new Set(
      teachers.map((t) => t.name.trim().toLocaleUpperCase("tr")),
    );

    let added = 0;
    for (const name of classNames) {
      if (!knownClassesInTerm.has(name.toLocaleUpperCase("tr"))) {
        await ctx.db.insert("classes", { userId, name, term: termKey });
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

/** Adds default class groups (and missing teachers) for an explicit dönem. */
export const ensureTermDefaults = mutation({
  args: { term: v.string() },
  handler: async (ctx, { term }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return { added: 0 };
    const termKey = term.trim();
    if (!termKey) return { added: 0 };

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
    const knownClassesInTerm = new Set(
      classes
        .filter((c) => normalizeTerm(c.term ?? "") === normalizeTerm(termKey))
        .map((c) => c.name.trim().toLocaleUpperCase("tr")),
    );
    const knownTeachers = new Set(
      teachers.map((t) => t.name.trim().toLocaleUpperCase("tr")),
    );

    let added = 0;
    for (const name of classNames) {
      if (!knownClassesInTerm.has(name.toLocaleUpperCase("tr"))) {
        await ctx.db.insert("classes", {
          userId,
          name,
          term: normalizeTerm(termKey),
        });
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
 * Copies classes & students of an earlier dönem into the current one (names
 * that already exist in the target term are skipped).
 */
export const copyRosterFromTerm = mutation({
  args: {
    fromTerm: v.string(),
    toTerm: v.string(),
    includeStudents: v.boolean(),
  },
  handler: async (ctx, { fromTerm, toTerm, includeStudents }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Giriş yapılmamış.");
    if (
      !fromTerm ||
      !toTerm ||
      normalizeTerm(fromTerm) === normalizeTerm(toTerm)
    ) {
      throw new Error("Geçersiz dönem seçimi.");
    }
    const classes = await ctx.db
      .query("classes")
      .withIndex("by_user_name", (q) => q.eq("userId", userId))
      .collect();
    const students = await ctx.db
      .query("students")
      .withIndex("by_user_name", (q) => q.eq("userId", userId))
      .collect();

    const existingClasses = new Set(
      classes
        .filter((c) => normalizeTerm(c.term ?? "") === normalizeTerm(toTerm))
        .map((c) => c.name.trim().toLocaleUpperCase("tr")),
    );
    const existingStudents = new Set(
      students
        .filter((s) => normalizeTerm(s.term ?? "") === normalizeTerm(toTerm))
        .map((s) => s.name.trim().toLocaleUpperCase("tr")),
    );

    let added = 0;
    for (const c of classes.filter(
      (x) => normalizeTerm(x.term ?? "") === normalizeTerm(fromTerm),
    )) {
      const key = c.name.trim().toLocaleUpperCase("tr");
      if (!existingClasses.has(key)) {
        await ctx.db.insert("classes", { userId, name: c.name, term: toTerm });
        existingClasses.add(key);
        added++;
      }
    }
    if (includeStudents) {
      for (const s of students.filter(
        (x) => normalizeTerm(x.term ?? "") === normalizeTerm(fromTerm),
      )) {
        const key = s.name.trim().toLocaleUpperCase("tr");
        if (!existingStudents.has(key)) {
          await ctx.db.insert("students", {
            userId,
            name: s.name,
            className: s.className ?? "",
            term: toTerm,
          });
          existingStudents.add(key);
          added++;
        }
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
    const termKey = termFromYmd(today) || "";
    const classNames = [
      "MEZUN SAY 1", "MEZUN SAY 2", "MEZUN SAY 3", "MEZUN EA 1", "MEZUN EA 2",
      "12 SAY 1", "12 SAY 2", "12 SAY CAL", "12 EA 1", "12 DİL",
      "11 SAY 1", "11 SAY 2", "11 SAY 3", "11 SAY CAL", "11 SAYISAL FEN", "11 EA 1",
      "10.SINIF", "9.SINIF",
    ];
    for (const name of classNames) {
      await ctx.db.insert("classes", { userId, name, term: termKey });
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

/* ------------------------------------------------------------------ */
/* Yedekten geri yükleme                                              */
/* ------------------------------------------------------------------ */

const BACKUP_TABLES = [
  "lessons",
  "classLessons",
  "extraLessons",
  "classExtraLessons",
  "classGroupExtraLessons",
  "teachers",
  "classes",
  "students",
] as const;

type BackupTable = (typeof BACKUP_TABLES)[number];

/**
 * Replaces ALL course data of the signed-in user with the rows of a backup.
 * Rows carry no userId (stripped client-side); the current user owns them.
 * Only the known lesson/roster tables are accepted.
 */
export const importBackup = mutation({
  args: {
    data: v.any(),
  },
  handler: async (ctx, { data }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Giriş yapılmamış.");
    if (!data || typeof data !== "object") {
      throw new Error("Geçersiz yedek dosyası.");
    }

    const payload = data as Record<string, unknown[]>;
    for (const table of BACKUP_TABLES) {
      if (payload[table] !== undefined && !Array.isArray(payload[table])) {
        throw new Error(`Geçersiz bölüm: ${table}`);
      }
    }

    const counts: Record<string, number> = {};
    for (const table of BACKUP_TABLES) {
      const queryDb = ctx.db.query(table as never) as unknown as {
        filter: (
          predicate: (q: never) => unknown,
        ) => Promise<Array<{ _id: string }>>;
      };
      const rows = await queryDb.filter(
        (q) => (q as never as { eq: (f: unknown, v: unknown) => unknown })
          .eq(
            (q as never as { field: (n: string) => unknown }).field("userId"),
            userId,
          ) as never,
      );
      for (const row of rows) {
        await (ctx.db.delete as (id: string) => Promise<void>)(row._id);
      }
      counts[table] = -rows.length; // will be updated below
    }

    for (const table of BACKUP_TABLES) {
      const rows = (payload[table] ?? []) as Array<Record<string, unknown>>;
      const insert = ctx.db.insert as (
        t: string,
        row: Record<string, unknown>,
      ) => Promise<string>;
      let inserted = 0;
      for (const raw of rows) {
        if (!raw || typeof raw !== "object") continue;
        const { _id: _drop, _creationTime: _drop2, ...fields } = raw;
        await insert(table, {
          ...fields,
          userId,
        });
        inserted++;
      }
      counts[table] = inserted;
    }

    return { counts };
  },
});
