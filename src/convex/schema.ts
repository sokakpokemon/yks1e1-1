import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove

      // set to true once the demo/sample data has been seeded for this user
      sampleDataLoaded: v.optional(v.boolean()),
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // Birebir ders kayıtları (her kullanıcı = bir kurs).
    // `date` saklanır "YYYY-MM-DD" (yerel tarih), saat `time` olarak "HH:mm".
    lessons: defineTable({
      userId: v.id("users"),
      studentName: v.string(),
      subject: v.string(),
      missingTopic: v.string(),
      teacherName: v.string(),
      date: v.string(),
      time: v.string(),
      status: v.union(
        v.literal("planned"),
        v.literal("completed"),
        v.literal("cancelled"),
      ),
      className: v.optional(v.string()),
    }).index("by_user_date", ["userId", "date"]),

    // Kursta görev alan öğretmenler.
    teachers: defineTable({
      userId: v.id("users"),
      name: v.string(),
    }).index("by_user", ["userId"]),

    // Sınıf / grup listesi (MEZUN SAY 1, 12 EA 1, ...). Dönem bazlıdır.
    classes: defineTable({
      userId: v.id("users"),
      name: v.string(),
      term: v.string(), // "2026/2027"
    }).index("by_user_name", ["userId", "name"]),

    // Öğrenci listesi (opsiyonel sınıf ataması ile). Dönem bazlıdır.
    students: defineTable({
      userId: v.id("users"),
      name: v.string(),
      className: v.optional(v.string()),
      term: v.string(), // "2026/2027"
    }).index("by_user_name", ["userId", "name"]),

    // Sınıf programındaki grup dersleri.
    classLessons: defineTable({
      userId: v.id("users"),
      className: v.string(),
      subject: v.string(),
      teacherName: v.string(),
      date: v.string(),
      time: v.string(),
    }).index("by_user_date", ["userId", "date"]),

    // Öğretmen birebir programına eklenen ek dersler (her hafta değişebilir).
    extraLessons: defineTable({
      userId: v.id("users"),
      title: v.string(),
      teacherName: v.string(),
      className: v.string(),
      date: v.string(),
      time: v.string(),
    }).index("by_user_date", ["userId", "date"]),

    // Sınıflara yazılan esnek ek dersler (haftalık/günlük değişebilir).
    // Havuzda bekleyen taleplerde date="" ve time="" olur; takvime
    // sürüklendiğinde gün/saat atanır.
    classExtraLessons: defineTable({
      userId: v.id("users"),
      className: v.string(),
      subject: v.string(),
      teacherName: v.string(),
      topic: v.string(),
      date: v.string(), // "YYYY-MM-DD" veya havuzda ""
      time: v.string(), // "HH:mm" veya havuzda ""
      term: v.string(), // talebin ait olduğu dönem ("2026/2027")
    }).index("by_user_date", ["userId", "date"]),

    // Sınıf (Grup) Ek Ders — bağımsız panel. Birebir mantığıyla sınıfa
    // öğretmen atanır; talep havuzdan öğretmenin haftalık takvimindeki boş
    // saate sürüklenerek planlanır. date="" => havuzda bekliyor.
    classGroupExtraLessons: defineTable({
      userId: v.id("users"),
      term: v.string(), // "2026/2027"
      className: v.string(), // sınıf / grup
      subject: v.string(), // branş (MATEMATİK, ...)
      teacherName: v.string(),
      topic: v.string(), // anlatılacak konu
      date: v.string(), // "YYYY-MM-DD" veya havuzda ""
      time: v.string(), // "HH:mm" veya havuzda ""
    }).index("by_user_date", ["userId", "date"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
