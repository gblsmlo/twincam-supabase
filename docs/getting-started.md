<div align="center">

# Twincan
## Getting Started

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-0A0A0A)](https://orm.drizzle.team)
[![Vitest](https://img.shields.io/badge/Vitest-3.2-6E9F18?logo=vitest)](https://vitest.dev)
[![Biome](https://img.shields.io/badge/Biome-2.2-60A5FA)](https://biomejs.dev)

</div>


## Tech Stack

-   **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
-   **Language:** [TypeScript](https://www.typescriptlang.org/)
-   **Styling:** [Tailwind CSS v4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/)
-   **UI Components:** [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/), [Sonner](https://sonner.emilkowal.ski/), [Vaul](https://vaul.emilkowal.ski/)
-   **Database:** [PostgreSQL](https://www.postgresql.org/), [Drizzle ORM](https://orm.drizzle.team/)
-   **Authentication:** [Better Auth](https://better-auth.com/)
-   **Forms:** [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/)
-   **Linting & Formatting:** [Biome](https://biomejs.dev/)
-   **Package Manager:** [pnpm](https://pnpm.io/)

## Project Structure

The project follows a modular architecture to separate concerns and improve maintainability:

```
src/
├── app/          # Next.js App Router pages and layouts
├── components/   # Reusable UI components (shadcn/ui, etc.)
├── hooks/        # Custom React hooks
├── infra/        # Infrastructure layer (Database, Auth, Env)
├── lib/          # External library configurations
├── modules/      # Feature-based modules (Domain logic)
├── shared/       # Shared utilities, types, and config
├── types/        # Global TypeScript types
└── utils/        # General utility functions
```

### Key Directories

-   **`src/modules`**: Contains the core business logic, organized by feature (e.g., `product`, `auth`). Each module encapsulates its own components, hooks, and logic.
-   **`src/infra`**: Handles external services and infrastructure concerns.
    -   `db`: Database schemas and connection logic.
    -   `env`: Environment variable validation.
    -   `auth`: Authentication configuration.

## Getting Started

### Prerequisites
-   **Node.js**: >= 22
-   **pnpm**: >= 10
-   **Docker**: For running the local database.

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd twincan
    ```

2.  Install dependencies:
    ```bash
    pnpm install
    ```

### Environment Setup

1.  Create a `.env` file in the root directory based on the following template:

    ```env
    # App
    NEXT_PUBLIC_URL=http://localhost:3000
    NODE_ENV=development
    PORT=3333

    # Database
    DATABASE_URL=postgresql://postgres:postgres@localhost:5432/twincan_db

    # Authentication (Better Auth)
    BETTER_AUTH_SECRET=your_super_secret_key
    BETTER_AUTH_URL=http://localhost:3000

    # Google OAuth
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret
    ```

### Database Setup

1.  Start the PostgreSQL database using Docker Compose:
    ```bash
    docker-compose up -d
    ```

2.  Push the database schema:
    ```bash
    pnpm db:push
    # or
    pnpm db:migrate
    ```

### Running the Application

Start the development server:

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

## Scripts

-   `pnpm dev`: Starts the development server.
-   `pnpm build`: Builds the application for production.
-   `pnpm start`: Starts the production server.
-   `pnpm lint`: Checks for linting errors using Biome.
-   `pnpm lint:fix`: Fixes linting errors.
-   `pnpm db:generate`: Generates Drizzle migrations.
-   `pnpm db:migrate`: Runs Drizzle migrations.
-   `pnpm db:studio`: Opens Drizzle Studio to view/edit data.

## Conventions
-   **Commit Messages**: We use [Conventional Commits](https://www.conventionalcommits.org/).
    -   Example: `feat: add new product module`, `fix: resolve auth issue`.
-   **Code Style**: Enforced by Biome. Run `pnpm lint:fix` before committing.
-   **Imports**: Use absolute imports (e.g., `@/components/ui/button`) configured in `tsconfig.json`.

## 📝 License

[MIT](LICENSE)
