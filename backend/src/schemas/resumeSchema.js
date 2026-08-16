const { z } = require("zod");

const locationSchema = z
  .union([
    z.string(),
    z
      .object({
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        address: z.string().optional(),
      })
      .transform((loc) =>
        [loc.address, loc.city, loc.state, loc.country].filter(Boolean).join(", ")
      ),
  ])
  .transform(String)
  .default("");

const basicInfoSchema = z.object({
  name: z.string().trim().default(""),
  email: z.string().trim().default(""),
  phone: z.string().trim().default(""),
  location: locationSchema,
  linkedin: z.string().trim().default(""),
  github: z.string().trim().default(""),
  website: z.string().trim().default(""),
  summary: z.string().trim().default(""),
  title: z.string().trim().default(""),
});

const experienceSchema = z.object({
  company: z.string().trim().default(""),
  role: z.string().trim().default(""),
  location: z.string().trim().default(""),
  startDate: z.string().trim().default(""),
  endDate: z.string().trim().default(""),
  current: z.boolean().default(false),
  bullets: z.array(z.string().trim()).default([]),
});

const educationSchema = z.object({
  institution: z.string().trim().default(""),
  degree: z.string().trim().default(""),
  fieldOfStudy: z.string().trim().default(""),
  startDate: z.string().trim().default(""),
  endDate: z.string().trim().default(""),
  gpa: z.string().trim().default(""),
});

const skillGroupSchema = z.object({
  category: z.string().trim().default("General"),
  items: z.array(z.string().trim()).default([]),
});

const projectSchema = z.object({
  title: z.string().trim().default(""),
  description: z.string().trim().default(""),
  technologies: z.array(z.string().trim()).default([]),
  link: z.string().trim().default(""),
  bullets: z.array(z.string().trim()).default([]),
});

const certificationSchema = z.object({
  name: z.string().trim().default(""),
  issuer: z.string().trim().default(""),
  date: z.string().trim().default(""),
  url: z.string().trim().default(""),
});

const skillItemOrGroupSchema = z.union([
  skillGroupSchema,
  z.string().transform((str) => ({ category: "Technical Skills", items: [str] })),
]);

const skillsArrayOrObjectSchema = z.preprocess((val) => {
  if (!val) return [];
  if (Array.isArray(val)) {
    // If it's an array of strings, group them into a single category
    if (val.length > 0 && typeof val[0] === "string") {
      return [{ category: "Skills", items: val.map(String) }];
    }
    return val;
  }
  if (typeof val === "object") {
    // If it's an object { Frontend: ["React"], Backend: ["Node"] }
    return Object.entries(val).map(([category, items]) => ({
      category,
      items: Array.isArray(items) ? items.map(String) : [String(items)],
    }));
  }
  return [];
}, z.array(skillGroupSchema).default([]));

const structuredResumeSchema = z.object({
  basics: basicInfoSchema.default({}),
  experience: z.array(experienceSchema).default([]),
  education: z.array(educationSchema).default([]),
  skills: skillsArrayOrObjectSchema,
  projects: z.array(projectSchema).default([]),
  certifications: z.array(certificationSchema).default([]),
});

module.exports = {
  structuredResumeSchema,
  basicInfoSchema,
  experienceSchema,
  educationSchema,
  skillGroupSchema,
  projectSchema,
  certificationSchema,
};
