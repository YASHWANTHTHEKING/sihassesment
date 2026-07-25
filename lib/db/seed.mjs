import pg from "pg";

const { Client } = pg;
const DATABASE_URL = process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/placement_tracker";

const studentNames = [
  "Aarav Patel",
  "Ananya Sharma",
  "Rohan Singh",
  "Saanvi Gupta",
  "Ishaan Mehta",
  "Priya Nair",
  "Aryan Reddy",
  "Kavya Joshi",
  "Aditya Rao",
  "Nitya Shah",
  "Devansh Verma",
  "Mira Desai",
  "Arjun Iyer",
  "Dhruv Chatterjee",
  "Isha Kumari",
  "Vihaan Kaur",
  "Aanya Menon",
  "Krishna Joshi",
  "Shreya Nair",
  "Reyansh Kapoor",
  "Diya Bose",
  "Ankit Yadav",
  "Tara Chawla",
  "Siddharth Sinha",
  "Meera Reddy",
  "Rhea Nair",
  "Kunal Sharma",
  "Nisha Patel",
  "Vikram Joshi",
  "Simran Kaur",
  "Karan Mehta",
  "Pooja Singh",
  "Madhav Deshpande",
  "Tanvi Iyer",
  "Sahil Rao",
  "Ritika Bose",
  "Kabir Nair",
  "Aditi Choudhary",
  "Neil Kapoor",
  "Swati Verma",
  "Yash Sharma",
  "Anjali Gupta",
  "Rhea Sinha",
  "Nikhil Reddy",
  "Divya Joshi",
  "Kavya Menon",
  "Varun Patel",
  "Ira Desai",
  "Naman Agarwal",
  "Riya Kapoor",
  "Pranav Shah",
  "Sahana Bose",
  "Ritvik Iyer",
  "Ananya Khanna",
  "Ayaan Malik",
  "Nila Jain",
  "Samar Ghosh",
  "Ritika Chatterjee",
  "Aarushi Nair",
  "Atharv Mehta",
  "Devika Rao",
  "Ishita Verma",
  "Manav Singh",
  "Rhea Thakur",
  "Karan Bhatt",
  "Priyanka Joshi",
  "Arnav Khurana",
  "Kriti Sharma",
  "Tanya Iyer",
  "Neil Desai",
  "Aanya Reddy",
  "Darsh Patel",
  "Mira Kapoor",
  "Siddharth Sharma",
  "Anika Gupta",
  "Rohan Chatterjee",
  "Aadhya Nair",
  "Veer Singh",
  "Aisha Verma",
  "Arjun Bose",
  "Saisha Joshi",
  "Naveen Mehta",
  "Priya Kumar",
  "Kavya Sharma",
  "Ishaan Verma",
  "Naina Patel",
  "Raghav Rao",
  "Aditi Sen",
  "Vansh Khanna",
  "Riya Gupta",
  "Aarav Kapoor",
  "Mira Sharma",
  "Yash Raj",
  "Ananya Prasad",
  "Kunal Verma",
  "Nisha Reddy",
  "Devika Nair",
  "Rohan Joshi",
  "Simran Verma",
  "Arjun Patel",
  "Anika Shah",
  "Tara Mehta",
  "Neil Kapoor",
];

const companies = [
  "ByteWave Labs",
  "CloudNova",
  "AstraTech",
  "Nexa Solutions",
  "Verity Systems",
  "Pulse Analytics",
  "QuantumWorks",
  "BlueArc Innovations",
  "Vertex Dynamics",
  "Fusion Ventures",
  "Zenith AI",
  "CoreBridge",
  "OrbitEdge",
  "DataNest",
  "PrimeGen",
  "Nimbus Systems",
  "Stratus Financial",
  "Helix Digital",
  "Summit Robotics",
  "Arcadia Health",
];

const branches = [
  "CSE",
  "ECE",
  "EEE",
  "MECH",
  "CIVIL",
  "IT",
  "AIDS",
  "AIML",
  "Other",
];

const notesPool = [
  "Needs follow-up on interview schedule.",
  "Student requested more information on package timeline.",
  "Excellent profile, strong communication skills.",
  "Pending documents from student.",
  "Referral from training cell.",
  "Awaiting company confirmation.",
  "Scheduled for final interview next week.",
  "Requires guidance on salary expectations.",
  "High interest in product role.",
  "Focus on technical interview preparation.",
  null,
  null,
  null,
];

const stageOptions = [
  { stage: "Applied", offerStatus: "Pending" },
  { stage: "Shortlisted", offerStatus: "Pending" },
  { stage: "Interview", offerStatus: "Pending" },
  { stage: "Selected", offerStatus: "Offered" },
  { stage: "Rejected", offerStatus: "Rejected" },
];

function seededRng(seed = 123456789) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function pick(list, rnd) {
  return list[Math.floor(rnd() * list.length)];
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function formatTimestamp(date) {
  return date.toISOString();
}

function randomCgpa(rnd) {
  const value = 6 + rnd() * 4;
  return Math.round(value * 100) / 100;
}

function randomPackage(rnd, stage) {
  if (stage !== "Selected") return null;
  const value = 8 + rnd() * 14;
  return Math.round(value * 100) / 100;
}

function randomStage() {
  const weights = [0.28, 0.22, 0.18, 0.16, 0.16];
  const r = Math.random();
  let cumulative = 0;
  for (let i = 0; i < stageOptions.length; i += 1) {
    cumulative += weights[i];
    if (r <= cumulative) return stageOptions[i];
  }
  return stageOptions[stageOptions.length - 1];
}

async function main() {
  console.log("Connecting to database:", DATABASE_URL);
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log("Connected.");

    await client.query("BEGIN");
    await client.query("DROP TABLE IF EXISTS predictions");
    await client.query("DROP TABLE IF EXISTS applications");

    await client.query(`
      CREATE TABLE applications (
        id serial PRIMARY KEY,
        application_id text NOT NULL UNIQUE,
        student_id text NOT NULL,
        student_name text NOT NULL,
        company text NOT NULL,
        drive_date date NOT NULL,
        stage text NOT NULL DEFAULT 'Applied',
        offer_status text NOT NULL DEFAULT 'Pending',
        package numeric(6,2),
        cgpa numeric(4,2),
        branch text,
        notes text,
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        updated_at timestamp with time zone NOT NULL DEFAULT now()
      )
    `);

    await client.query(`
      CREATE TABLE predictions (
        id serial PRIMARY KEY,
        application_id integer NOT NULL,
        student_name text NOT NULL,
        company text NOT NULL,
        stage text NOT NULL,
        risk_level text NOT NULL,
        confidence numeric(5,4) NOT NULL,
        needs_attention boolean NOT NULL DEFAULT false,
        predicted_outcome text,
        created_at timestamp with time zone NOT NULL DEFAULT now()
      )
    `);

    const rnd = seededRng(987654321);
    const studentRecords = studentNames.map((studentName, index) => ({
      studentId: `STU-${String(index + 1).padStart(3, "0")}`,
      studentName,
    }));

    const applications = [];
    for (let i = 0; i < 100; i += 1) {
      const student = pick(studentRecords, rnd);
      const company = pick(companies, rnd);
      const branch = pick(branches, rnd);
      const note = pick(notesPool, rnd);
      const stageItem = pick(stageOptions, rnd);
      const stage = stageItem.stage;
      let offerStatus = stageItem.offerStatus;

      if (stage === "Interview" && rnd() < 0.18) {
        offerStatus = "Withdrawn";
      }

      const driveAge = Math.round(rnd() * 65) + (stage === "Selected" ? 20 : stage === "Rejected" ? 15 : 5);
      const driveDate = new Date();
      driveDate.setDate(driveDate.getDate() - driveAge);

      const createdAt = new Date(driveDate);
      createdAt.setDate(createdAt.getDate() + Math.round(rnd() * 5));
      const updatedAt = new Date(createdAt);
      updatedAt.setDate(updatedAt.getDate() + Math.round(rnd() * 7));

      applications.push({
        applicationId: `APP-${String(i + 1).padStart(4, "0")}`,
        studentId: student.studentId,
        studentName: student.studentName,
        company,
        driveDate: formatDate(driveDate),
        stage,
        offerStatus,
        package: randomPackage(rnd, stage),
        cgpa: randomCgpa(rnd),
        branch,
        notes: note,
        createdAt: formatTimestamp(createdAt),
        updatedAt: formatTimestamp(updatedAt),
      });
    }

    console.log(`Inserting ${applications.length} application rows...`);
    for (const application of applications) {
      await client.query(
        `INSERT INTO applications (
          application_id,
          student_id,
          student_name,
          company,
          drive_date,
          stage,
          offer_status,
          package,
          cgpa,
          branch,
          notes,
          created_at,
          updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          application.applicationId,
          application.studentId,
          application.studentName,
          application.company,
          application.driveDate,
          application.stage,
          application.offerStatus,
          application.package,
          application.cgpa,
          application.branch,
          application.notes,
          application.createdAt,
          application.updatedAt,
        ],
      );
    }

    await client.query("COMMIT");
    console.log("Seeding complete.");

    const countResult = await client.query("SELECT count(*) AS count FROM applications");
    console.log("Applications count:", countResult.rows[0].count);
  } catch (error) {
    console.error("Seed failed:", error);
    await client.query("ROLLBACK").catch(() => undefined);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
