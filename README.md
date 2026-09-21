# Smart Cadence Grid

Smart Cadence Grid is a campus intelligence dashboard for navigation, occupancy, transport, and live operational context. It combines a TanStack Start frontend with an Express + MongoDB backend for authentication, building data, attendance, announcements, analytics, and related campus services.

## Features

- Live campus dashboard with occupancy, analytics, and announcements
- Authentication with JWT cookies and role-based access control
- Building, classroom, lab, department, event, and announcement management
- Attendance capture that updates classroom and building occupancy
- Campus map views for 2D and 3D layouts
- AI chat and navigation-oriented UI surfaces

## Tech Stack

- TanStack Start
- React 19
- TypeScript
- Tailwind CSS
- Express 5
- MongoDB with Mongoose

## Prerequisites

- Node.js 20 or newer
- npm
- A running MongoDB instance, local or hosted with MongoDB Atlas

If you are developing locally, make sure MongoDB is started before running the app or the seed script. On Windows, that usually means starting the MongoDB service if you installed MongoDB Community Server, or using a hosted MongoDB Atlas database in `MONGODB_URI`.

## Setup

1. Install dependencies.

```sh
npm install
```

2. Create a `.env` file in the repository root.

Copy the values below or start from [.env.example](.env.example).

```env
MONGODB_URI=mongodb://127.0.0.1:27017/smart_cadence_grid
JWT_SECRET=change-this-to-a-long-random-secret
PORT=3001
CLIENT_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173
VITE_API_BASE_URL=http://localhost:3001/api
```

3. Seed the database if you want the sample data and default users.

```sh
npm run seed
```

Default seeded credentials:

- Admin: `admin@campus.edu` / `admin123`
- Student: `student@campus.edu` / `student123`

## Development

Run the frontend and backend together:

```sh
npm run dev
```

This starts the Vite frontend and the Express API server at the same time. The API listens on port `3001` by default.

If you want to run only the backend:

```sh
npm run server
```

## Environment Variables

- `MONGODB_URI`: MongoDB connection string, default `mongodb://127.0.0.1:27017/smart_cadence_grid`
- `JWT_SECRET`: Secret used to sign authentication tokens
- `PORT`: Backend port, default `3001`
- `CLIENT_ORIGINS`: Comma-separated list of allowed browser origins for CORS
- `VITE_API_BASE_URL`: Frontend API root, defaults to `http://localhost:3001/api`

## Troubleshooting

- If the backend says it cannot connect to MongoDB, verify the service is running before starting `npm run server` or `npm run seed`.
- If you are using MongoDB Atlas, set `MONGODB_URI` to your Atlas connection string and allow your current IP address in Atlas Network Access.
- MongoDB creates the `smart_cadence_grid` database automatically when the seed script inserts data.

## Scripts

- `npm run dev` - start frontend and backend together
- `npm run server` - start only the Express API
- `npm run seed` - seed MongoDB with demo data
- `npm run build` - build the frontend for production
- `npm run preview` - preview the production build locally
- `npm run lint` - run ESLint across the workspace
- `npm run format` - format the workspace with Prettier
- `npm run export-maps` - regenerate map JSON from the DXF sources

## Project Structure

- `src/` - TanStack Start app, routes, components, and shared frontend logic
- `server/` - Express API, models, middleware, routes, and seed script
- `public/maps/` - generated campus map data used by the frontend
- `scripts/` - utility scripts, including DXF map export

## Notes

- The frontend calls the backend through `VITE_API_BASE_URL`; update it if the API is hosted on a different origin.
- The API uses MongoDB for persistent data. If MongoDB is unavailable, the backend will not start.
- The repository currently contains some static mock data used by a few UI routes, while core data flows through the API.

## License

Refer to the upstream project or repository metadata for licensing details.
