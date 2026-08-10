const { z } = require("zod");

const basicInfoSchema = z.object({
  name: z.string().trim().default(""),
  email: z.string().trim().default(""),
  phone: z.string().trim().default(""),
  location: z.string().trim().default(""),
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

const structuredResumeSchema = z.object({
  basics: basicInfoSchema.default({}),
  experience: z.array(experienceSchema).default([]),
  education: z.array(educationSchema).default([]),
  skills: z.array(skillGroupSchema).default([]),
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
