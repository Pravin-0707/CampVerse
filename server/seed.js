import "dotenv/config";

import bcrypt from "bcryptjs";
import { connectDatabase, disconnectDatabase } from "./db/mongo.js";
import { User } from "./models/User.js";
import { Building } from "./models/Building.js";
import { Classroom } from "./models/Classroom.js";
import { Lab } from "./models/Lab.js";
import { Department } from "./models/Department.js";
import { Event } from "./models/Event.js";
import { Announcement } from "./models/Announcement.js";
import { Bus } from "./models/Bus.js";
import { EmergencyContact } from "./models/EmergencyContact.js";
import { Batch } from "./models/Batch.js";
import { ClassSection } from "./models/ClassSection.js";
import { Subject } from "./models/Subject.js";
import { Timetable } from "./models/Timetable.js";

async function seed() {
  try {
    await connectDatabase();
    console.log("Connected to MongoDB for seeding!");
  } catch (err) {
    console.error("Seeding failed: unable to connect to MongoDB.");
    console.error(
      "Start MongoDB locally or set MONGODB_URI to a reachable MongoDB Atlas/local instance.",
    );
    console.error(err);
    process.exit(1);
  }

  // Clear existing
  await Promise.all([
    User.deleteMany({}),
    Building.deleteMany({}),
    Classroom.deleteMany({}),
    Lab.deleteMany({}),
    Department.deleteMany({}),
    Event.deleteMany({}),
    Announcement.deleteMany({}),
    Bus.deleteMany({}),
    EmergencyContact.deleteMany({}),
    Batch.deleteMany({}),
    ClassSection.deleteMany({}),
    Subject.deleteMany({}),
    Timetable.deleteMany({}),
  ]);

  // Seed Users
  const adminPass = await bcrypt.hash("admin123", 10);
  const studentPass = await bcrypt.hash("student123", 10);
  const professorPass = await bcrypt.hash("professor123", 10);

  await User.create([
    {
      name: "Alex Sharma",
      email: "admin@campus.edu",
      passwordHash: adminPass,
      role: "admin",
      campus: "Main Campus",
    },
    {
      name: "Dr. Anjali Rao",
      email: "professor@campus.edu",
      passwordHash: professorPass,
      role: "professor",
      campus: "Main Campus",
    },
    {
      name: "Sam Student",
      email: "student@campus.edu",
      passwordHash: studentPass,
      role: "student",
      campus: "Main Campus",
    },
  ]);
  console.log(
    "Seeded default users (Admin: admin@campus.edu / admin123, Professor: professor@campus.edu / professor123)",
  );

  // Seed Buildings
  await Building.create([
    { code: "c1", name: "C1 Block" },
    { code: "c2", name: "C2 Block" },
    { code: "c3", name: "C3 Block" },
    { code: "c4", name: "C4 Block" },
    { code: "c5", name: "C5 Block" },
    { code: "c6", name: "C6 Block" },
    { code: "mba", name: "MBA Block" },
    { code: "mca", name: "MCA Block" },
    { code: "admin", name: "Admin Block" },
    { code: "c7", name: "C7 Block" },
    { code: "c8", name: "C8 Block" },
    { code: "eee", name: "EEE Block" },
    { code: "mechanical", name: "Mechanical Block" },
    { code: "ece", name: "ECE Block" },
    { code: "cse-it", name: "CSE/IT Block" },
    { code: "mechatronics", name: "Mechatronics Block" },
    { code: "convention-center", name: "Convention Center" },
    { code: "library", name: "Venkatraman Library" },
  ]);
  console.log("Seeded campus blocks");

  // Seed Classrooms
  await Classroom.create([
    {
      code: "C1 03",
      building: "C1 Block",
      currentClass: "II MCT A",
      capacity: 80,
      occupancy: 79,
      status: "In Use",
    },
    {
      code: "C1 04",
      building: "C1 Block",
      currentClass: "II MCT B",
      capacity: 80,
      occupancy: 75,
      status: "In Use",
    },
    {
      code: "C1 05",
      building: "C1 Block",
      currentClass: "II AIML",
      capacity: 78,
      occupancy: 65,
      status: "In Use",
    },
    {
      code: "C1 06",
      building: "C1 Block",
      currentClass: "III AIML",
      capacity: 72,
      occupancy: 63,
      status: "In Use",
    },
    {
      code: "C1 11",
      building: "C1 Block",
      currentClass: "III MCT B",
      capacity: 80,
      occupancy: 74,
      status: "In Use",
    },
    {
      code: "C1 12",
      building: "C1 Block",
      currentClass: "III MECH A",
      capacity: 80,
      occupancy: 75,
      status: "In Use",
    },
    {
      code: "C2 01",
      building: "C2 Block",
      currentClass: "III EEE A",
      capacity: 80,
      occupancy: 73,
      status: "In Use",
    },
    {
      code: "C2 02",
      building: "C2 Block",
      currentClass: "III EEE B",
      capacity: 80,
      occupancy: 74,
      status: "In Use",
    },
    {
      code: "C2 05",
      building: "C2 Block",
      currentClass: "III CSE E",
      capacity: 80,
      occupancy: 64,
      status: "In Use",
    },
    {
      code: "C2 14",
      building: "C2 Block",
      currentClass: "II CSE A",
      capacity: 80,
      occupancy: 81,
      status: "In Use",
    },
    {
      code: "C3 01",
      building: "C3 Block",
      currentClass: "I CIVIL A",
      capacity: 72,
      occupancy: 50,
      status: "In Use",
    },
    {
      code: "C3 02",
      building: "C3 Block",
      currentClass: "I CIVIL B",
      capacity: 72,
      occupancy: 45,
      status: "In Use",
    },
    {
      code: "C3 03",
      building: "C3 Block",
      currentClass: "I MCT A",
      capacity: 72,
      occupancy: 72,
      status: "In Use",
    },
    {
      code: "C4 05",
      building: "C4 Block",
      currentClass: "II CIVIL A",
      capacity: 72,
      occupancy: 70,
      status: "In Use",
    },
    {
      code: "C5 01",
      building: "C5 Block",
      currentClass: "III CSE B",
      capacity: 80,
      occupancy: 81,
      status: "In Use",
    },
    {
      code: "C5 02",
      building: "C5 Block",
      currentClass: "III CSE A",
      capacity: 96,
      occupancy: 86,
      status: "In Use",
    },
    {
      code: "C6 01",
      building: "C6 Block",
      currentClass: "III ECE A",
      capacity: 80,
      occupancy: 67,
      status: "In Use",
    },
    {
      code: "C6 21",
      building: "C6 Block",
      currentClass: "I ECE A",
      capacity: 80,
      occupancy: 80,
      status: "In Use",
    },
    {
      code: "C7 01",
      building: "C7 Block",
      currentClass: "II IT A",
      capacity: 80,
      occupancy: 82,
      status: "In Use",
    },
    {
      code: "AB-L03",
      building: "Academic Block",
      currentClass: "II CSE J",
      capacity: 90,
      occupancy: 80,
      status: "In Use",
    },
    {
      code: "AB-G03",
      building: "Academic Block",
      currentClass: "I CSE A",
      capacity: 90,
      occupancy: 90,
      status: "In Use",
    },
    {
      code: "C4 15",
      building: "C4 Block",
      currentClass: "I M.E (SE)",
      capacity: 0,
      occupancy: 0,
      status: "Assigned",
    },
    {
      code: "C4 04",
      building: "C4 Block",
      currentClass: "I M.Tech (DS)",
      capacity: 0,
      occupancy: 0,
      status: "Assigned",
    },
  ]);
  console.log("Seeded Classrooms");

  // Seed Labs
  await Lab.create([
    {
      name: "Alankay, Niklauswirth",
      building: "CSE BLOCK Ground floor",
      floor: 0,
      status: "Available",
      capacity: 35,
      occupancy: 28,
    },
    {
      name: "Dijkstra, Donald",
      building: "CSE BLOCK 1st floor",
      floor: 1,
      status: "In Use",
      capacity: 35,
      occupancy: 30,
    },
    {
      name: "Edger F Codd Lab",
      building: "MCT/ECE 1st floor",
      floor: 1,
      status: "Available",
      capacity: 30,
      occupancy: 15,
    },
    {
      name: "Advanced Automation",
      building: "MCT/ECE 2nd floor",
      floor: 2,
      status: "In Use",
      capacity: 25,
      occupancy: 22,
    },
    {
      name: "DSP Lab",
      building: "MCT/ECE 2nd floor",
      floor: 2,
      status: "Available",
      capacity: 30,
      occupancy: 18,
    },
    {
      name: "Jim Gray Lab (JIMGREY)",
      building: "MCT/ECE 2nd floor",
      floor: 2,
      status: "Available",
      capacity: 30,
      occupancy: 12,
    },
    {
      name: "CAM Lab (James Truchard Lab MC 03)",
      building: "MCT ground floor left corner",
      floor: 0,
      status: "In Use",
      capacity: 30,
      occupancy: 25,
    },
    {
      name: "C4 2nd Floor Lab 1,2",
      building: "C4 Block 2nd floor",
      floor: 2,
      status: "Available",
      capacity: 40,
      occupancy: 32,
    },
    {
      name: "Peterchen",
      building: "MCA Block 2nd floor",
      floor: 2,
      status: "In Use",
      capacity: 30,
      occupancy: 20,
    },
    {
      name: "CAR Hoare",
      building: "MCA Block 2nd floor",
      floor: 2,
      status: "Available",
      capacity: 30,
      occupancy: 14,
    },
    {
      name: "Linus Torvalds",
      building: "MBA Block 2nd floor",
      floor: 2,
      status: "Available",
      capacity: 35,
      occupancy: 26,
    },
    {
      name: "Digital Library (Civil Lab & Mech Lab)",
      building: "Library 1st floor",
      floor: 1,
      status: "Available",
      capacity: 60,
      occupancy: 45,
    },
  ]);
  console.log("Seeded 12 Campus Labs");

  // Seed Departments
  await Department.create([
    { name: "Computer Science and Engineering (AI & ML)", head: "Not published" },
    { name: "Information Technology", head: "Not published" },
    { name: "Civil Engineering", head: "Not published" },
    { name: "Computer Science and Engineering", head: "Not published" },
    { name: "Computer Science and Engineering (Cyber Security)", head: "Not published" },
    { name: "Electrical and Electronics Engineering", head: "Not published" },
    { name: "Electronics and Communication Engineering", head: "Not published" },
    { name: "Mechanical Engineering", head: "Not published" },
    { name: "Mechatronics Engineering", head: "Not published" },
    { name: "Artificial Intelligence and Data Science", head: "Not published" },
    { name: "Computer Science and Business Systems", head: "Not published" },
    { name: "Data Science (M.Tech)", head: "Not published" },
    { name: "Structural Engineering (M.E)", head: "Not published" },
    { name: "Computer Science and Engineering (M.E)", head: "Not published" },
    { name: "Business Administration (MBA)", head: "Not published" },
    { name: "Science and Humanities", head: "Not published" },
  ]);
  console.log("Seeded Departments");

  const department = await Department.findOne({ name: "Computer Science and Engineering" });
  if (!department) throw new Error("Academic seed department was not found");
  const batch = await Batch.create({ name: "CSE 2025", academicYear: "2025-2029" });
  const section = await ClassSection.create({
    name: "CSE-A",
    departmentId: department.id,
    batchId: batch.id,
    year: 2,
  });
  const subject = await Subject.create({
    code: "CS603",
    name: "Deep Learning",
    departmentId: department.id,
    credits: 4,
  });
  const professor = await User.findOne({ email: "professor@campus.edu" });
  if (!professor) throw new Error("Professor seed user was not found");
  await Timetable.create({
    classSectionId: section.id,
    subjectId: subject.id,
    professorId: professor.id,
    classroomCode: "C3 03",
    dayOfWeek: "Monday",
    period: 3,
    startTime: "10:00",
    endTime: "11:00",
  });
  console.log("Seeded academic foundation (batch, section, subject, timetable)");

  // Seed Events
  await Event.create([
    {
      name: "AI Summit 2026",
      date: "Jul 28",
      type: "Seminar",
      location: "Main Auditorium",
      seats: 240,
      description: "Annual conference on frontier AI models and spatial computing.",
    },
    {
      name: "Hackathon 6.0",
      date: "Aug 02",
      type: "Hackathon",
      location: "Innovation Hub",
      seats: 500,
      description: "36-hour sprint building real-world campus solutions.",
    },
    {
      name: "Google Placement Drive",
      date: "Aug 09",
      type: "Placement",
      location: "Placement Cell",
      seats: 120,
      description: "Campus recruitment drive for software engineering roles.",
    },
    {
      name: "Robotics Workshop",
      date: "Aug 14",
      type: "Workshop",
      location: "C6 Block",
      seats: 80,
      description: "Hands-on autonomous drone control workshop.",
    },
  ]);
  console.log("Seeded Events");

  // Seed Announcements
  await Announcement.create([
    {
      title: "Hackathon 6.0 registrations open",
      tag: "Events",
      time: "2h ago",
      content: "Register teams before July 25th.",
    },
    {
      title: "Library extended hours this week",
      tag: "Library",
      time: "5h ago",
      content: "Open till midnight for upcoming midterms.",
    },
    {
      title: "Shuttle route B updated",
      tag: "Transport",
      time: "1d ago",
      content: "New stop added near Sports Complex.",
    },
  ]);
  console.log("Seeded Announcements");

  // Seed Buses
  await Bus.create([
    {
      code: "R-01",
      route: "Campus Gate → Hostel",
      eta: "3 min",
      driver: "R. Sharma",
      status: "On route",
    },
    { code: "R-02", route: "Metro → Campus", eta: "8 min", driver: "K. Verma", status: "On route" },
    { code: "R-03", route: "Library → Sports", eta: "12 min", driver: "S. Patel", status: "Idle" },
  ]);
  console.log("Seeded Buses");

  // Seed Emergency Contacts
  await EmergencyContact.create([
    { label: "Campus Security", number: "1800-100-200", order: 1 },
    { label: "Medical Center", number: "1800-100-300", order: 2 },
    { label: "Fire Emergency", number: "101", order: 3 },
    { label: "Ambulance", number: "102", order: 4 },
  ]);
  console.log("Seeded Emergency Contacts");

  console.log("\nMongoDB seeding completed successfully!");
  await disconnectDatabase();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
