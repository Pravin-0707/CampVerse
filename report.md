# CampVerse Base Architecture Report

## 1. Project Overview

CampVerse is a campus management and navigation system for students, professors, administrators, and guests. The application combines campus navigation, buildings, classrooms, laboratories, attendance, occupancy, announcements, events, analytics, and academic structure in one system.

The core design principle is:

```text
User -> Role -> Permissions -> Academic/Campus Modules -> MongoDB
```

The system uses one common authentication flow. After login, the backend identifies the user's role and the frontend displays the appropriate capabilities.

## 2. Technology Stack

### Frontend

- React 19
- TypeScript
- TanStack Start and TanStack Router
- Tailwind CSS
- Leaflet and React Leaflet for geographic maps
- Recharts for analytics
- Framer Motion for interface animation

### Backend

- Node.js
- Express 5
- Mongoose
- JWT authentication
- HTTP-only cookies
- bcrypt password hashing

### Database

- MongoDB, locally or through MongoDB Atlas
- Mongoose models with timestamps and JSON serialization

## 3. User Roles

The system has four roles:

| Role | Purpose | Access Level |
|---|---|---|
| Admin | System and campus management | Full access |
| Professor | Teaching, attendance, timetable, and academic operations | Academic staff access |
| Student | Personal academic information and campus services | Restricted read access |
| Guest | Public campus discovery and navigation | Public navigation access |

Public registration creates student accounts only. Privileged accounts must be created by an authenticated administrator through the backend.

## 4. Permission Model

| Capability | Admin | Professor | Student | Guest |
|---|---:|---:|---:|---:|
| View campus map | Yes | Yes | Yes | Yes |
| Navigate campus | Yes | Yes | Yes | Yes |
| View buildings and classrooms | Yes | Yes | Yes | Yes |
| Manage buildings | Full | No | No | No |
| Manage laboratories | Full | No | No | No |
| Manage users | Full | No | No | No |
| Manage departments and batches | Full | No | No | No |
| Manage classes and subjects | Full | Assigned scope | No | No |
| Manage timetables | Full | View assigned | View own class | No |
| Mark attendance | Full | Yes | No | No |
| View personal attendance | Yes | Assigned students | Own records | No |
| Manage announcements | Full | Own announcements | No | No |
| View private announcements | Yes | Yes | Targeted only | No |
| View analytics and occupancy | Full | Relevant data | Limited | No |

Authorization is enforced by Express middleware, not only by hiding frontend buttons.

## 5. Application Modules

### Authentication and Authorization

Located in `server/routes/auth.js` and `server/middleware/auth.js`.

Responsibilities:

- Registration and login
- JWT token creation
- HTTP-only cookie authentication
- Current-user lookup
- Admin-only user provisioning
- Role-based request protection

### User Management

The `User` model stores identity, role, campus, preferences, notification settings, and account status.

### Academic Management

The academic relationship is structured as:

```text
Department
  -> Batch / Academic Year
    -> Class Section
      -> Students
      -> Subjects
      -> Timetable
        -> Professor
        -> Classroom
```

Current academic models:

- `Department`
- `Batch`
- `ClassSection`
- `Subject`
- `Timetable`

The academic API is available under `/api/academics`.

### Campus Management

Campus data is split into:

- Buildings
- Classrooms
- Laboratories
- Campus map data
- Navigation waypoints and route edges

Buildings, classrooms, and labs are stored in MongoDB. Navigation coordinates are stored in the frontend navigation engine and use the supplied campus latitude and longitude values.

### Attendance and Occupancy

Attendance is connected to the physical campus:

```text
Class Section -> Timetable -> Classroom -> Attendance -> Classroom Occupancy -> Building Occupancy
```

When attendance is recorded, the backend:

1. Validates the classroom.
2. Clamps attendance to classroom capacity.
3. Updates classroom occupancy and status.
4. Recalculates building occupancy.
5. Stores an attendance history record.

### Announcements and Events

Announcements and events are stored and served through backend APIs. The frontend no longer relies on the removed frontend mock data for buildings, labs, events, dashboard announcements, or analytics charts.

### Campus Navigation

Guests and authenticated users can access map and route pages without exposing private academic data.

Navigation uses:

- Real latitude and longitude campus coordinates
- A waypoint graph
- Dijkstra shortest-path calculation
- Leaflet map rendering
- Optional walking route visualization

The old colored waypoint dots were removed from the map. The route line remains visible when a route is selected.

## 6. Database Architecture

### Main Collections

| Collection | Purpose |
|---|---|
| `users` | Authentication and user profiles |
| `departments` | Academic departments |
| `batches` | Academic years and student batches |
| `class_sections` | Classes such as CSE-A |
| `subjects` | Courses and subjects |
| `timetables` | Professor, subject, class, time, and room relationship |
| `buildings` | Physical campus buildings and coordinates |
| `classrooms` | Rooms, capacity, and live occupancy |
| `labs` | Laboratory facilities and availability |
| `attendance` | Attendance and occupancy history |
| `announcements` | Campus communication |
| `events` | Campus events |
| `buses` | Transport data |
| `emergencycontacts` | Emergency services |

### Common Fields

MongoDB models use:

- `_id` as the primary identifier
- `id` as a frontend-friendly serialized identifier
- `createdAt`
- `updatedAt`
- `status` where lifecycle management is required

Email and subject codes use unique indexes. Archived or inactive records should be preferred over destructive deletion for academic records.

## 7. Backend Structure

```text
server/
  index.js                 Express application entry point
  seed.js                  Demo and development database seed
  middleware/
    auth.js                JWT authentication and role middleware
  db/
    mongo.js               MongoDB connection
    model-factory.js       Shared Mongoose model configuration
  models/                  Mongoose models
  routes/                  REST API route modules
```

### API Groups

```text
/api/auth
/api/buildings
/api/classrooms
/api/labs
/api/departments
/api/academics
/api/attendance
/api/announcements
/api/events
/api/analytics
/api/chat
/api/buses
/api/emergency
/api/health
```

## 8. Frontend Structure

```text
src/
  routes/                  Page-level routes
  components/              Shared UI and map components
  hooks/                   Authentication and responsive hooks
  lib/
    api.ts                Backend API client
    navigation-engine.ts  Waypoints and shortest-path logic
    utils.ts               Shared utilities
  styles.css               Global styles
```

Important route groups:

- Dashboard
- Buildings
- Classrooms
- Labs
- Departments
- Events
- Analytics
- Map and navigation
- Admin buildings
- Admin attendance
- Login and registration

## 9. Guest Access Flow

Guests do not need a full account for navigation.

```text
Open application
  -> Open map or navigation route
    -> Select start location
      -> Select destination
        -> View route
```

Public navigation routes include:

```text
/map-2d
/navigation
/campus-3d
```

Guest users must not receive attendance, student, professor, private announcement, or internal academic data.

## 10. Seed and Development Workflow

Create a root `.env` file:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@YOUR_CLUSTER.mongodb.net/campverse
JWT_SECRET=use-a-long-random-secret
PORT=3001
CLIENT_ORIGINS=http://localhost:8080,http://127.0.0.1:8080
VITE_API_BASE_URL=http://localhost:3001/api
```

Install dependencies:

```powershell
npm install
```

Seed MongoDB:

```powershell
npm run seed
```

Start frontend and backend:

```powershell
npm run dev
```

Frontend:

```text
http://localhost:8080
```

Backend health check:

```text
http://localhost:3001/api/health
```

The seed command clears development collections before inserting its data. It requires MongoDB Atlas Network Access to allow the current IP address.

## 11. Current Known Limitations

- Some dashboard occupancy summary values are still configured as demonstration analytics on the backend.
- Student-to-class-section enrollment and professor assignment need dedicated APIs and screens.
- Timetable conflict validation should be added before production use.
- Navigation currently uses a graph of known locations; turn-by-turn road routing is not yet connected to an external routing engine.
- Frontend API types should be strengthened to reduce use of `any`.
- JWT fallback secrets should be removed in production and required through environment configuration.
- Database migrations or versioned seed scripts should be introduced before production deployment.

## 12. Recommended Implementation Order

1. Complete authentication, account status, and role authorization.
2. Add admin user, department, batch, class, subject, and timetable management.
3. Add student enrollment and professor assignment relationships.
4. Implement professor attendance workflows.
5. Implement student attendance and timetable views.
6. Connect occupancy analytics to real attendance and classroom data.
7. Add announcement targeting by department, batch, class, and role.
8. Expand campus locations and navigation graph from verified campus survey data.
9. Add audit logs, validation, rate limiting, and production monitoring.

## 13. Final Blueprint

```text
Users
  -> Roles: Admin | Professor | Student | Guest
    -> Permissions
      -> Authentication and Authorization
        -> Academic Modules
        -> Campus Modules
        -> Attendance and Occupancy
        -> Announcements and Events
        -> Navigation and Maps
          -> Express REST APIs
            -> Mongoose Models
              -> MongoDB Atlas
```

CampVerse is now structured as one connected campus system rather than a collection of unrelated pages. The next major foundation milestone is linking real students and professors to class sections, subjects, timetables, and attendance records.
