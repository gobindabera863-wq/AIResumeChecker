import {
  Document,
  Page,
  Text,
  View,
  Link,
  StyleSheet,
} from "@react-pdf/renderer";

const C = {
  ink: "#111418",
  inkMuted: "#5C6470",
  accent: "#2F4A3A",
  accentSoft: "#E6EFE8",
  hairline: "#E5E5DF",
  bg: "#FFFFFF",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 48,
    fontSize: 10,
    color: C.ink,
    fontFamily: "Helvetica",
    backgroundColor: C.bg,
    lineHeight: 1.5,
  },

  // header
  headerWrap: {
    marginBottom: 18,
  },
  name: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    letterSpacing: -0.5,
    color: C.ink,
    lineHeight: 1.15,
    marginBottom: 4,
  },
  title: {
    fontSize: 11,
    fontFamily: "Helvetica",
    color: C.accent,
    letterSpacing: 0.4,
    lineHeight: 1.3,
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    fontSize: 9,
    color: C.inkMuted,
    marginTop: 2,
  },
  contactItem: {
    marginRight: 12,
    marginBottom: 3,
  },
  link: {
    color: C.accent,
    textDecoration: "none",
  },
  rule: {
    marginTop: 10,
    height: 1,
    backgroundColor: C.hairline,
  },

  // sections
  section: {
    marginTop: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionHeaderText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.4,
    color: C.accent,
    textTransform: "uppercase",
  },
  sectionHeaderLine: {
    flex: 1,
    height: 0.6,
    backgroundColor: C.hairline,
    marginLeft: 10,
  },

  // summary & raw text
  summary: {
    fontSize: 9.75,
    lineHeight: 1.5,
    color: C.ink,
  },

  // experience
  expItem: {
    marginBottom: 10,
  },
  expHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 1,
  },
  expRole: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: C.ink,
  },
  expPeriod: {
    fontSize: 9,
    color: C.inkMuted,
    fontFamily: "Helvetica",
  },
  expCompanyLine: {
    fontSize: 9.5,
    color: C.inkMuted,
    marginBottom: 4,
  },
  expCompany: {
    fontFamily: "Helvetica-Bold",
    color: C.accent,
  },
  bullet: {
    flexDirection: "row",
    marginBottom: 2.5,
    paddingLeft: 2,
  },
  bulletDot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: C.accent,
    marginRight: 8,
    marginTop: 5,
  },
  bulletText: {
    flex: 1,
    fontSize: 9.75,
    lineHeight: 1.45,
    color: C.ink,
  },

  // education
  eduItem: {
    marginBottom: 6,
  },
  eduRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  eduDegree: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: C.ink,
  },
  eduMeta: {
    fontSize: 9,
    color: C.inkMuted,
  },
  eduSchool: {
    fontSize: 9.5,
    color: C.accent,
    marginTop: 1,
  },

  // projects
  projItem: {
    marginBottom: 8,
  },
  projHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 2,
  },
  projName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: C.ink,
    marginRight: 8,
  },
  projTech: {
    fontSize: 9,
    color: C.accent,
  },
  projDesc: {
    fontSize: 9.75,
    color: C.ink,
    lineHeight: 1.45,
  },

  // skills
  skillsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  skillChip: {
    fontSize: 9,
    backgroundColor: C.accentSoft,
    color: C.accent,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },

  // footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: C.inkMuted,
    paddingTop: 6,
    borderTopWidth: 0.6,
    borderTopColor: C.hairline,
  },
});

function SectionHeader({ children }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{children}</Text>
      <View style={styles.sectionHeaderLine} />
    </View>
  );
}

function Bullet({ children }) {
  return (
    <View style={styles.bullet} wrap={false}>
      <View style={styles.bulletDot} />
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

function ContactItem({ children, href }) {
  if (href) {
    return (
      <Link src={href} style={[styles.contactItem, styles.link]}>
        {children}
      </Link>
    );
  }
  return <Text style={styles.contactItem}>{children}</Text>;
}

export function ResumeDocument({ user, version, title }) {
  const s = version?.structuredData || version?.parsedSections || {};
  const basics = s.basics || {};

  const displayName = basics.name?.trim() || user?.name || title || "Candidate";
  const displayEmail = basics.email?.trim() || user?.email || "";
  const displayTitle = basics.title?.trim() || version?.targetRole || "";

  // Normalize skills list
  const skillList = Array.isArray(s.skills)
    ? s.skills.flatMap((item) =>
        typeof item === "string" ? item : item.items || []
      )
    : [];

  // Normalize summary
  const summaryText = s.summary || basics.summary || "";

  return (
    <Document title={title || displayName || "Resume"} author={displayName}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerWrap}>
          <Text style={styles.name}>{displayName}</Text>
          {displayTitle ? <Text style={styles.title}>{displayTitle}</Text> : null}

          <View style={styles.contactRow}>
            {basics.location ? <ContactItem>{basics.location}</ContactItem> : null}
            {displayEmail ? (
              <ContactItem href={`mailto:${displayEmail}`}>{displayEmail}</ContactItem>
            ) : null}
            {basics.phone ? <ContactItem>{basics.phone}</ContactItem> : null}
            {basics.linkedin ? <ContactItem>{basics.linkedin}</ContactItem> : null}
            {basics.github ? <ContactItem>{basics.github}</ContactItem> : null}
          </View>

          <View style={styles.rule} />
        </View>

        {/* Summary */}
        {summaryText ? (
          <View style={styles.section}>
            <SectionHeader>Summary</SectionHeader>
            <Text style={styles.summary}>{summaryText}</Text>
          </View>
        ) : null}

        {/* Experience */}
        {Array.isArray(s.experience) && s.experience.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader>Experience</SectionHeader>
            {s.experience.map((exp, i) => {
              const period =
                exp.period ||
                (exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : exp.startDate || "");
              return (
                <View key={i} style={styles.expItem} wrap={false}>
                  <View style={styles.expHeader}>
                    <Text style={styles.expRole}>{exp.role || "Role"}</Text>
                    {period ? <Text style={styles.expPeriod}>{period}</Text> : null}
                  </View>
                  {(exp.company || exp.location) && (
                    <Text style={styles.expCompanyLine}>
                      {exp.company ? <Text style={styles.expCompany}>{exp.company}</Text> : null}
                      {exp.company && exp.location ? "  ·  " : ""}
                      {exp.location || ""}
                    </Text>
                  )}
                  {(exp.bullets || []).map((b, j) => (
                    <Bullet key={j}>{b}</Bullet>
                  ))}
                </View>
              );
            })}
          </View>
        ) : null}

        {/* Projects */}
        {Array.isArray(s.projects) && s.projects.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader>Projects</SectionHeader>
            {s.projects.map((proj, i) => {
              const projTitle = proj.title || proj.name || "Project";
              const techStr = Array.isArray(proj.technologies)
                ? proj.technologies.join(" · ")
                : proj.tech
                ? proj.tech.join(" · ")
                : "";
              return (
                <View key={i} style={styles.projItem} wrap={false}>
                  <View style={styles.projHeader}>
                    <Text style={styles.projName}>{projTitle}</Text>
                    {techStr ? <Text style={styles.projTech}>{techStr}</Text> : null}
                  </View>
                  {proj.description ? <Text style={styles.projDesc}>{proj.description}</Text> : null}
                  {(proj.bullets || []).map((b, j) => (
                    <Bullet key={j}>{b}</Bullet>
                  ))}
                </View>
              );
            })}
          </View>
        ) : null}

        {/* Education */}
        {Array.isArray(s.education) && s.education.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader>Education</SectionHeader>
            {s.education.map((edu, i) => {
              const period =
                edu.period ||
                (edu.startDate && edu.endDate ? `${edu.startDate} - ${edu.endDate}` : edu.startDate || "");
              const school = edu.institution || edu.school || "";
              const details = edu.fieldOfStudy || edu.details || "";
              return (
                <View key={i} style={styles.eduItem} wrap={false}>
                  <View style={styles.eduRow}>
                    <Text style={styles.eduDegree}>{edu.degree || "Degree"}</Text>
                    {period ? <Text style={styles.eduMeta}>{period}</Text> : null}
                  </View>
                  {school ? <Text style={styles.eduSchool}>{school}</Text> : null}
                  {details ? <Text style={styles.eduMeta}>{details}</Text> : null}
                </View>
              );
            })}
          </View>
        ) : null}

        {/* Skills */}
        {skillList.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader>Skills</SectionHeader>
            <View style={styles.skillsGrid}>
              {skillList.map((skill, i) => (
                <Text key={i} style={styles.skillChip}>
                  {skill}
                </Text>
              ))}
            </View>
          </View>
        ) : null}

        {/* Raw Text Fallback if structuredData is absent */}
        {!summaryText &&
          (!s.experience || !s.experience.length) &&
          version?.rawText && (
            <View style={styles.section}>
              <SectionHeader>Resume Content</SectionHeader>
              <Text style={styles.summary}>{version.rawText}</Text>
            </View>
          )}

        <View style={styles.footer} fixed>
          <Text>{displayName}</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
