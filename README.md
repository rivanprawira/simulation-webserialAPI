# Web Serial API Integration

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app) with Web Serial API integration, database persistence, and state management.

## Features

- Web Serial API integration for device communication
- Persistent connection state between page navigation
- SQLite database for storing command history and configuration
- State management with Zustand
- Modern UI with TailwindCSS

## Getting Started

First, install dependencies:

```bash
npm install
# or
yarn install
```

Initialize the database:

```bash
npm run prisma:migrate
npm run prisma:seed
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Structure

- `app/api/` - API routes for database access
- `components/` - UI components 
- `lib/` - Utilities and state management
- `prisma/` - Database schema and migrations

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
