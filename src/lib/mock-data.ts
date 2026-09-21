export const buildings = [
  {
    id: "b1",
    name: "C1 Block",
    departments: ["Mechanical Engineering", "Civil Engineering"],
    floors: 4,
    occupancy: 76,
    status: "Open",
    image: "https://images.unsplash.com/photo-1562774053-701939374585?w=800&auto=format&fit=crop",
  },
  {
    id: "b2",
    name: "C2 Block",
    departments: ["Electrical & Electronics", "Computer Science"],
    floors: 4,
    occupancy: 54,
    status: "Open",
    image:
      "https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=800&auto=format&fit=crop",
  },
  {
    id: "b3",
    name: "C3 Block",
    departments: ["Civil Engineering", "Mechatronics"],
    floors: 4,
    occupancy: 68,
    status: "Open",
    image:
      "https://images.unsplash.com/photo-1581093588401-fbb62a02f120?w=800&auto=format&fit=crop",
  },
  {
    id: "b4",
    name: "C4 Block",
    departments: ["Electronics & Communication", "Applied Sciences"],
    floors: 4,
    occupancy: 72,
    status: "Open",
    image:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&auto=format&fit=crop",
  },
  {
    id: "b5",
    name: "C5 Block",
    departments: ["Computer Science and Engineering"],
    floors: 4,
    occupancy: 82,
    status: "Open",
    image:
      "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&auto=format&fit=crop",
  },
  {
    id: "b6",
    name: "C6 Block & Auditorium",
    departments: ["ECE", "Auditorium & Conventions"],
    floors: 3,
    occupancy: 41,
    status: "Open",
    image:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop",
  },
  {
    id: "b7",
    name: "Venkatraman Library",
    departments: ["Library", "Digital Zone"],
    floors: 4,
    occupancy: 62,
    status: "Open",
    image:
      "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&auto=format&fit=crop",
  },
  {
    id: "b8",
    name: "Admin Block",
    departments: ["Administration", "Student Affairs"],
    floors: 3,
    occupancy: 50,
    status: "Open",
    image:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop",
  },
];

export const occupancyByHour = [
  { hour: "8AM", value: 22 },
  { hour: "9AM", value: 48 },
  { hour: "10AM", value: 72 },
  { hour: "11AM", value: 88 },
  { hour: "12PM", value: 76 },
  { hour: "1PM", value: 54 },
  { hour: "2PM", value: 82 },
  { hour: "3PM", value: 90 },
  { hour: "4PM", value: 68 },
  { hour: "5PM", value: 42 },
  { hour: "6PM", value: 28 },
  { hour: "7PM", value: 18 },
];

export const buildingUsage = buildings.map((b) => ({
  name: b.name.split(" ")[0],
  usage: b.occupancy,
}));

export const energyData = [
  { day: "Mon", kwh: 420 },
  { day: "Tue", kwh: 512 },
  { day: "Wed", kwh: 488 },
  { day: "Thu", kwh: 602 },
  { day: "Fri", kwh: 540 },
  { day: "Sat", kwh: 220 },
  { day: "Sun", kwh: 180 },
];

export const upcomingClasses = [
  { time: "10:00", subject: "Deep Learning", room: "C3-05", faculty: "Dr. Rao" },
  { time: "11:30", subject: "Systems Design", room: "C2-14", faculty: "Prof. Iyer" },
  { time: "14:00", subject: "Quantum Computing", room: "AI Lab", faculty: "Dr. Menon" },
  { time: "16:00", subject: "Robotics Workshop", room: "C1-12", faculty: "Prof. Khan" },
];

export const announcements = [
  { title: "Hackathon 6.0 registrations open", tag: "Events", time: "2h ago" },
  { title: "Library extended hours this week", tag: "Library", time: "5h ago" },
  { title: "Shuttle route B updated", tag: "Transport", time: "1d ago" },
];

export const activities = [
  { text: "New occupancy sensor deployed in C-Block", time: "5m ago" },
  { text: "Building layout map updated", time: "22m ago" },
  { text: "Emergency drill completed", time: "1h ago" },
];

export const events = [
  { name: "AI Summit 2026", date: "Jul 28", type: "Seminar", seats: 240 },
  { name: "Hackathon 6.0", date: "Aug 02", type: "Hackathon", seats: 500 },
  { name: "Google Placement Drive", date: "Aug 09", type: "Placement", seats: 120 },
  { name: "Robotics Workshop", date: "Aug 14", type: "Workshop", seats: 80 },
];

export const buses = [
  {
    id: "R-01",
    route: "Campus Gate → Hostels",
    eta: "3 min",
    driver: "R. Sharma",
    status: "On route",
  },
  { id: "R-02", route: "Metro → Campus", eta: "8 min", driver: "K. Verma", status: "On route" },
  { id: "R-03", route: "Library → Sports", eta: "12 min", driver: "S. Patel", status: "Idle" },
];

export const emergencyContacts = [
  { label: "Campus Security", number: "1800-100-200" },
  { label: "Medical Center", number: "1800-100-300" },
  { label: "Fire Emergency", number: "101" },
  { label: "Ambulance", number: "102" },
];

export const room = {
  number: "C3-05",
  department: "Computer Science",
  capacity: 60,
  occupancy: 42,
  faculty: "Dr. Anjali Rao",
  currentClass: "Deep Learning — CS603",
  facilities: ["Projector", "AC", "Smart Board", "WiFi", "Computers"],
  exitDistance: "18 m",
  washroom: "12 m",
  lift: "22 m",
};

export const labs = [
  {
    id: "lab-1",
    name: "Alankay, Niklauswirth",
    building: "CSE BLOCK Ground floor",
    floor: 0,
    status: "Available",
    capacity: "28 / 35",
  },
  {
    id: "lab-2",
    name: "Dijkstra, Donald",
    building: "CSE BLOCK 1st floor",
    floor: 1,
    status: "In Use",
    capacity: "30 / 35",
  },
  {
    id: "lab-3",
    name: "Edger F Codd Lab",
    building: "MCT/ECE 1st floor",
    floor: 1,
    status: "Available",
    capacity: "15 / 30",
  },
  {
    id: "lab-4",
    name: "Advanced Automation",
    building: "MCT/ECE 2nd floor",
    floor: 2,
    status: "In Use",
    capacity: "22 / 25",
  },
  {
    id: "lab-5",
    name: "DSP Lab",
    building: "MCT/ECE 2nd floor",
    floor: 2,
    status: "Available",
    capacity: "18 / 30",
  },
  {
    id: "lab-6",
    name: "Jim Gray Lab (JIMGREY)",
    building: "MCT/ECE 2nd floor",
    floor: 2,
    status: "Available",
    capacity: "12 / 30",
  },
  {
    id: "lab-7",
    name: "CAM Lab (James Truchard Lab MC 03)",
    building: "MCT ground floor left corner",
    floor: 0,
    status: "In Use",
    capacity: "25 / 30",
  },
  {
    id: "lab-8",
    name: "C4 2nd Floor Lab 1,2",
    building: "C4 Block 2nd floor",
    floor: 2,
    status: "Available",
    capacity: "32 / 40",
  },
  {
    id: "lab-9",
    name: "Peterchen",
    building: "MCA Block 2nd floor",
    floor: 2,
    status: "In Use",
    capacity: "20 / 30",
  },
  {
    id: "lab-10",
    name: "CAR Hoare",
    building: "MCA Block 2nd floor",
    floor: 2,
    status: "Available",
    capacity: "14 / 30",
  },
  {
    id: "lab-11",
    name: "Linus Torvalds",
    building: "MBA Block 2nd floor",
    floor: 2,
    status: "Available",
    capacity: "26 / 35",
  },
  {
    id: "lab-12",
    name: "Digital Library (Civil Lab & Mech Lab)",
    building: "Library 1st floor",
    floor: 1,
    status: "Available",
    capacity: "45 / 60",
  },
];
