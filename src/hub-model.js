export const hubCategories = [
  ["Report", "Reports", "Operational insights, kept private until reviewed."],
  [
    "Minutes",
    "Meeting minutes",
    "Agendas, discussion notes and approved outcomes.",
  ],
  [
    "Meeting",
    "Meeting calendar",
    "Plan conversations and see what is coming next.",
  ],
  ["Action", "Action tracker", "Clear owners, due dates and progress."],
  [
    "Decision",
    "Decisions register",
    "A shared record of what was agreed and why.",
  ],
  [
    "Notice",
    "Staff noticeboard",
    "Timely updates for the right staff audience.",
  ],
  [
    "Policy",
    "Policy acknowledgements",
    "Publish a version and record who has read it.",
  ],
];
export function sampleHubRecords() {
  const tomorrow = new Date(Date.now() + 86400000).toISOString();
  return [
    {
      category: "Report",
      title: "Workforce support summary (demo)",
      body: "Fictional draft report. Review staffing priorities, open support requests and development needs before sharing an approved summary.",
      state: "Draft",
      classification: "Confidential",
    },
    {
      category: "Minutes",
      title: "People & culture planning meeting (demo)",
      body: "Agenda: staff support, attendance processes and professional development. Discussion: demonstration notes only. Decisions and actions must be recorded by the administrator before publication.",
      state: "Draft",
      classification: "Confidential",
    },
    {
      category: "Meeting",
      title: "Staff wellbeing planning session (demo)",
      body: "A fictional planning meeting for staff wellbeing and practical workplace support. No individual health information is included.",
      state: "Published",
      classification: "Staff-ready",
      starts_at: tomorrow,
      venue: "Demo meeting room",
    },
    {
      category: "Action",
      title: "Review induction checklist (demo)",
      body: "Review the staff induction checklist and bring suggested improvements to the next HR meeting. This is fictional demonstration work.",
      state: "Published",
      classification: "Staff-ready",
      due_on: tomorrow.slice(0, 10),
      owner: "Demo HR team",
    },
    {
      category: "Decision",
      title: "Use one staff communication workspace (demo)",
      body: "Demonstration decision: keep approved general staff notices in one searchable location. Confidential personnel and health records remain separate.",
      state: "Published",
      classification: "Staff-ready",
    },
    {
      category: "Notice",
      title: "Welcome to the staff noticeboard (demo)",
      body: "This fictional notice demonstrates how an administrator can publish a reviewed update to authorized KISC staff. It is not an official school announcement.",
      state: "Published",
      classification: "Staff-ready",
    },
    {
      category: "Policy",
      title: "Demonstration privacy reading exercise",
      body: "This is an example policy acknowledgement, not an official KISC policy or employment agreement. Read the fictional text and use the acknowledgement control to try the workflow.",
      state: "Published",
      classification: "Staff-ready",
    },
  ].map((r, i) => ({
    id: i + 1,
    seed_key: "hub-demo-" + r.category.toLowerCase(),
    school_id: null,
    version: 1,
    workflow_state: "Open",
    due_on: null,
    starts_at: null,
    owner: "",
    venue: "",
    author: "Demo HR administrator",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    acknowledged: false,
    acknowledgement_count: 0,
    ...r,
  }));
}
