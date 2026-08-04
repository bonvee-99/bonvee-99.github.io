<!--
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  THIS FILE IS THE SINGLE SOURCE OF TRUTH FOR THE RESUME.                   │
  │                                                                           │
  │  Edit here, then run:   npm run resume                                    │
  │                                                                           │
  │  That regenerates:                                                        │
  │    • src/scripts/resume.js   (drives the website — DO NOT edit by hand)   │
  │    • public/resume.pdf       (the downloadable PDF)                        │
  │                                                                           │
  │  FORMAT (the parser is strict about this — see scripts/build-resume.mjs): │
  │    • Contact:  "# Name", then "- Key: Value" lines                        │
  │    • Sections: "## Experience" / "## Projects" / "## Education" / "## Skills"
  │    • Job:      "### Company | Location"                                    │
  │                "**Title** | Start – End"                                   │
  │                "- bullet"                                                  │
  │    • Project:  "### Title | https://link | Start – End"  (link optional:   │
  │                "### Title | Start – End" if there is no link)              │
  │    • Edu:      "### School | Location"                                     │
  │                "**Degree** | Start – End"                                  │
  │                optional "- GPA: ..." / "- Coursework: a, b, c"             │
  │    • Skills:   "- Category: item, item, item"                             │
  │    • Date ranges use an en dash with spaces:  "Start – End"                │
  └─────────────────────────────────────────────────────────────────────────┘
-->

# Ben Vinnick
- Location: Toronto, ON
- Phone: (604)-506-6024
- Email: benvinnick@gmail.com
- Portfolio: https://benvinnick.com
- GitHub: https://github.com/bonvee-99
- LinkedIn: https://www.linkedin.com/in/benvinnick

## Experience

### Veeva Systems | Toronto, ON
**Associate Software Engineer** | Sept 2025 – Present
- Refactoring a **Spring Boot microservice** toward single responsibility, moving business logic out so it purely handles AS2 transmissions
- Consolidated ownership of a cross-team data mapping, scoping most changes to a single team
- Redesigned how connections are configured, migrating from a single shared profile to per-connection profiles via a custom copy action and data migration

### CleanBill | Vancouver, BC
**Software Developer (Contract, Part-Time)** | April 2025 – Aug 2025
- Built an event-driven pipeline (**Inngest**, **AWS Textract**) to automate billing data extraction from ER visit summaries, **eliminating a manual triage step that scaled with intake volume (~1 hr/day)**
- Designed a **bucketing algorithm** to infer each document's billing shift from overlapping time windows
- Extended the parser to extract clinical notes based on OCR text-block geometry

### TAIT | Vancouver, BC (Remote)
**Software Developer Intern** | May 2024 – Aug 2024
- Collaborated on [Feltboard](https://www.taittowers.com/feltboard), a Digital CMS for the Experience Design industry
- Optimized storage efficiency by implementing shared media buckets, **reducing redundant uploads by up to 5X**
- Enhanced user workflow by creating a “save as” feature, allowing users to easily replicate and modify data structures

### TAIT | Vancouver, BC (Remote)
**Software Developer Intern** | July 2022 – Aug 2023
- Developed a frontend dashboard using **Vue** to allow users to monitor key metrics within their connected devices
- Facilitated dynamic schema relationships, empowering users to effortlessly create and manage intricate content structures by referencing one schema from another

### University of British Columbia | Vancouver, BC
**Teaching Assistant** | Sept 2021 – Dec 2022
- Taught fundamental programming skills and concepts such as recursion, graph traversal, testing, and debugging
- Led weekly labs and office hours for over 1200 students over three academic semesters

## Projects

### Loltest | https://github.com/bonvee-99/loltest | June 2026 – Present
- Built a **Go microservice** game backend with concurrency-safe matchmaking and a load-test harness simulating thousands of concurrent players

### Sports Macros | https://sports-macros.benvinnick.com/ | Oct 2021 – Present
- Facilitates effortless generation of macros, optimizing the media captioning workflow within Photo Mechanic
- Utilized by professional NHL photographers during **every Vancouver Canucks home game for the past 5 seasons**

## Education

### University of British Columbia | Vancouver, BC
**Bachelor of Science, Computer Science** | Sept 2019 – April 2025

## Skills
- Languages: Java, Go, TypeScript, JavaScript, Bash, SQL, NoSQL, GraphQL, HTML, CSS
- Frameworks: Node.js, React, Next.js, Vue.js, JUnit, Mocha, Chai
- Other: Git, Docker, Kubernetes, GCP, AWS, Terraform, Jenkins, Datadog, Jira
