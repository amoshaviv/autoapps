// Five fixture sheets of deliberately different shapes (PLAN P1-4).
// Values are what the Sheets API returns with FORMATTED_VALUE: strings, and
// rows shorter than the header when trailing cells are empty.
// P1-6 creates these as real spreadsheets in the builder's Drive.

export interface FixtureSheet {
  title: string;
  sheetTitle: string;
  values: string[][];
}

const budget: FixtureSheet = {
  title: "FY2027 Budget",
  sheetTitle: "Budget",
  values: [
    ["FY2027 Budget — draft, owners fill in Q1–Q4"],
    [],
    ["Cost Center", "Owner Email", "FY2026 Actual", "Q1", "Q2", "Q3", "Q4", "Justification", "Status"],
    ["Marketing", "sam@acme.example", "$420,000", "", "", "", "", "", "Not started"],
    ["Sales", "dana@acme.example", "$610,000", "$160,000", "$150,000", "$155,000", "$170,000", "Two new AEs in Q1", "Submitted"],
    ["Engineering", "lee@acme.example", "$1,250,000", "", "", "", "", "", "Not started"],
    ["Customer Success", "priya@acme.example", "$380,000", "$95,000", "$95,000", "$100,000", "$100,000", "", "Submitted"],
    ["Finance", "finance@acme.example", "$210,000", "$52,000", "$52,000", "$53,000", "$53,000", "Flat year over year", "Approved"],
    ["People", "jordan@acme.example", "$190,000", "", "", "", "", "", "Not started"],
    ["IT", "alex@acme.example", "$340,000", "", "", "", "", "", "Not started"],
    ["Legal", "morgan@acme.example", "$150,000", "", "", "", "", "", "Not started"],
    ["Facilities", "casey@acme.example", "$280,000", "", "", "", "", "", "Not started"],
    ["Product", "riley@acme.example", "$450,000", "", "", "", "", "", "Not started"],
    ["Design", "taylor@acme.example", "$220,000", "", "", "", "", "", "Not started"],
    ["Data", "jamie@acme.example", "$310,000", "", "", "", "", "", "Not started"],
    ["Security", "quinn@acme.example", "$270,000", "", "", "", "", "", "Not started"],
    ["Partnerships", "avery@acme.example", "$160,000", "", "", "", "", "", "Not started"],
    ["Events", "drew@acme.example", "$130,000", "", "", "", "", "", "Not started"],
  ],
};

const people = ["Sam Rivera", "Dana Cohen", "Lee Park", "Priya Shah", "Jordan Blake", "Alex Kim"];
const tasks: FixtureSheet = {
  title: "Q4 Launch Tasks",
  sheetTitle: "Tasks",
  values: [
    ["Task", "Assignee", "Due Date", "Priority", "Status", "Notes"],
    ...[
      ["Write launch blog post", 0, "2026-10-20", "High", "In progress", "Draft in Docs"],
      ["Update pricing page", 1, "2026-10-06", "High", "To do", ""],
      ["Record demo video", 2, "2026-10-28", "Medium", "To do", ""],
      ["Prepare sales deck", 1, "2026-10-13", "High", "Done", ""],
      ["QA checkout flow", 2, "2026-10-09", "High", "Blocked", "Waiting on staging"],
      ["Localize emails", 3, "2026-11-03", "Low", "To do", ""],
      ["Set up analytics events", 4, "2026-10-15", "Medium", "In progress", ""],
      ["Draft press release", 0, "2026-10-22", "Medium", "To do", ""],
      ["Train support team", 5, "2026-10-27", "Medium", "To do", ""],
      ["Update help center", 5, "2026-10-24", "Low", "To do", ""],
      ["Security review", 2, "2026-10-08", "High", "Done", "Signed off"],
      ["Partner announcement", 3, "2026-10-30", "Low", "To do", ""],
      ["Social media plan", 0, "2026-10-17", "Medium", "In progress", ""],
      ["Webinar logistics", 4, "2026-11-05", "Low", "To do", ""],
      ["Customer beta feedback", 3, "2026-10-12", "High", "Done", ""],
      ["Finalize launch date", 1, "2026-10-02", "High", "Done", "Oct 29 confirmed"],
      ["Status page copy", 4, "2026-10-26", "Low", "To do", ""],
      ["Onboarding checklist", 5, "2026-10-19", "Medium", "In progress", ""],
      ["Launch day runbook", 2, "2026-10-28", "High", "To do", ""],
      ["Internal all-hands demo", 1, "2026-10-29", "Medium", "To do", ""],
      ["Retrospective invite", 4, "2026-11-10", "Low", "To do", ""],
      ["Update changelog", 0, "2026-10-29", "Low", "To do", "After release"],
    ].map(([task, who, due, priority, status, notes]) =>
      [task as string, people[who as number], due as string, priority as string, status as string, notes as string]
    ),
  ],
};

const inventory: FixtureSheet = {
  title: "Office Supplies Inventory",
  sheetTitle: "Inventory",
  values: [
    ["SKU", "Item", "Category", "Quantity", "Reorder Level", "Location", "Last Counted"],
    ["SKU-1001", "A4 paper (box)", "Paper", "42", "20", "Storage A", "9/15/2026"],
    ["SKU-1002", "Sticky notes", "Paper", "15", "25", "Storage A", "9/2/2026"],
    ["SKU-1003", "Ballpoint pens (50)", "Writing", "8", "10", "Storage B", "9/18/2026"],
    ["SKU-1004", "Whiteboard markers", "Writing", "30", "10", "Storage B", "8/28/2026"],
    ["SKU-1005", "Stapler", "Desk", "12", "5", "Storage A", "9/10/2026"],
    ["SKU-1006", "Staples (box)", "Desk", "3", "10", "Storage A", "9/10/2026"],
    ["SKU-1007", "USB-C cables", "Electronics", "25", "10", "IT closet", "9/1/2026"],
    ["SKU-1008", "HDMI adapters", "Electronics", "6", "5", "IT closet", "9/1/2026"],
    ["SKU-1009", "Notebooks", "Paper", "55", "20", "Storage B", "9/12/2026"],
    ["SKU-1010", "Coffee beans (kg)", "Kitchen", "4", "5", "Kitchen", "9/20/2026"],
    ["SKU-1011", "Tea bags (100)", "Kitchen", "9", "5", "Kitchen", "9/20/2026"],
    ["SKU-1012", "Paper cups (50)", "Kitchen", "18", "10", "Kitchen", "9/5/2026"],
    ["SKU-1013", "Printer toner", "Electronics", "2", "5", "IT closet", "8/30/2026"],
    ["SKU-1014", "Envelopes (100)", "Paper", "11", "10", "Storage A", "9/15/2026"],
    ["SKU-1015", "Scissors", "Desk", "14", "5", "Storage B", "9/11/2026"],
    ["SKU-1016", "Tape dispensers", "Desk", "7", "5", "Storage B", "9/11/2026"],
    ["SKU-1017", "Highlighters", "Writing", "22", "10", "Storage B", "9/18/2026"],
    ["SKU-1018", "Keyboard", "Electronics", "5", "3", "IT closet", "9/1/2026"],
    ["SKU-1019", "Mouse", "Electronics", "9", "3", "IT closet", "9/1/2026"],
    ["SKU-1020", "Dish soap", "Kitchen", "3", "4", "Kitchen", "9/20/2026"],
  ],
};

const rsvp: FixtureSheet = {
  title: "Offsite RSVP (Form responses)",
  sheetTitle: "Form Responses 1",
  values: [
    ["Timestamp", "Name", "Email", "Attending?", "Dietary needs", "Plus one"],
    ["9/1/2026 10:15:32", "Sam Rivera", "sam@acme.example", "TRUE", "", "No"],
    ["9/1/2026 11:02:10", "Dana Cohen", "dana@acme.example", "TRUE", "Vegetarian", "Yes"],
    ["9/1/2026 14:45:01", "Lee Park", "lee@acme.example", "FALSE", "", "No"],
    ["9/2/2026 9:05:44", "Priya Shah", "priya@acme.example", "TRUE", "Vegan", "No"],
    ["9/2/2026 16:30:12", "Jordan Blake", "jordan@acme.example", "TRUE", "", "Yes"],
    ["9/3/2026 8:12:55", "Alex Kim", "alex@acme.example", "TRUE", "", "No"],
    ["9/3/2026 12:40:09", "Morgan Lee", "morgan@acme.example", "FALSE", "", "No"],
    ["9/4/2026 10:01:18", "Casey Brown", "casey@acme.example", "TRUE", "Gluten-free", "No"],
    ["9/4/2026 18:22:47", "Riley Adams", "riley@acme.example", "TRUE", "", "Yes"],
    ["9/5/2026 9:59:03", "Taylor Green", "taylor@acme.example", "TRUE", "", "No"],
    ["9/6/2026 11:11:11", "Jamie Fox", "jamie@acme.example", "TRUE", "Vegetarian", "No"],
    ["9/7/2026 13:37:00", "Quinn Hart", "quinn@acme.example", "FALSE", "", "No"],
    ["9/8/2026 15:20:30", "Avery Stone", "avery@acme.example", "TRUE", "", "Yes"],
    ["9/9/2026 17:45:15", "Drew Miles", "drew@acme.example", "TRUE", "", "No"],
  ],
};

const headcount: FixtureSheet = {
  title: "2026 New Hires",
  sheetTitle: "Headcount",
  values: [
    ["Employee", "Manager Email", "Department", "Start Date", "Level", "Salary Band", "Onboarding Complete"],
    ["Nora Quinn", "lee@acme.example", "Engineering", "Mar 3, 2026", "L4", "B2", "TRUE"],
    ["Omar Haddad", "lee@acme.example", "Engineering", "Jan 12, 2026", "L5", "B3", "TRUE"],
    ["Ines Duarte", "dana@acme.example", "Sales", "Aug 17, 2026", "L3", "B1", "FALSE"],
    ["Kenji Sato", "priya@acme.example", "Customer Success", "Feb 2, 2026", "L4", "B2", "TRUE"],
    ["Maya Levi", "lee@acme.example", "Engineering", "Sep 7, 2026", "L3", "B1", "FALSE"],
    ["Luca Romano", "dana@acme.example", "Sales", "Apr 6, 2026", "L4", "B2", "TRUE"],
    ["Zara Ali", "jordan@acme.example", "People", "Jun 1, 2026", "L5", "B3", "TRUE"],
    ["Ethan Brooks", "lee@acme.example", "Engineering", "Sep 14, 2026", "L6", "B4", "FALSE"],
    ["Hana Kim", "priya@acme.example", "Customer Success", "May 11, 2026", "L3", "B1", "TRUE"],
    ["Diego Torres", "dana@acme.example", "Sales", "Sep 21, 2026", "L4", "B2", "FALSE"],
    ["Aisha Bello", "jordan@acme.example", "People", "Jul 13, 2026", "L4", "B2", "TRUE"],
    ["Felix Wagner", "lee@acme.example", "Engineering", "Aug 3, 2026", "L5", "B3", "FALSE"],
    ["Sofia Rossi", "priya@acme.example", "Customer Success", "Mar 23, 2026", "L4", "B2", "TRUE"],
    ["Noah Evans", "dana@acme.example", "Sales", "Jan 26, 2026", "L3", "B1", "TRUE"],
    ["Leah Friedman", "lee@acme.example", "Engineering", "Sep 28, 2026", "L4", "B2", "FALSE"],
    ["Samir Nasser", "jordan@acme.example", "People", "Feb 16, 2026", "L3", "B1", "TRUE"],
    ["Clara Moreau", "priya@acme.example", "Customer Success", "Aug 24, 2026", "L5", "B3", "FALSE"],
    ["Ben Carter", "dana@acme.example", "Sales", "Jun 15, 2026", "L4", "B2", "TRUE"],
  ],
};

export const fixtures = { budget, tasks, inventory, rsvp, headcount };
export type FixtureName = keyof typeof fixtures;
