# Supabase Local Development Setup

This guide explains how to set up and run Supabase locally with Clerk authentication integration.

## Prerequisites

- **Docker Desktop** must be installed and running
- **Node.js** v18+ installed
- **npm** package manager

## Installation Steps

### 1. Start Docker Desktop

Make sure Docker Desktop is running before proceeding. You can verify by running:

```bash
docker --version
```

You should see output like: `Docker version 28.5.1, build e180ab8`

### 2. Install Supabase CLI

Supabase CLI can be run via `npx` without global installation. The project uses **Supabase CLI v2.58.5+** to support Clerk third-party authentication.

```bash
# Check current version
npx supabase --version

# Use specific version
npx supabase@2.58.5 start
```

**Note:** Older versions (v2.15.8 and below) do not support the `auth.third_party.clerk` configuration.

### 3. Configure Clerk Integration

The Clerk integration is configured in `supabase/config.toml`:

```toml
# Use Clerk as a third-party provider alongside Supabase Auth.
[auth.third_party.clerk]
enabled = true
# Your Clerk domain from the Clerk Dashboard
domain = "your-clerk-instance.clerk.accounts.dev"
```

**Important:** The `domain` field is required when `enabled = true`. Get this from your Clerk Dashboard under **Configure > Domains**.

### 4. Start Supabase

```bash
npx supabase@2.58.5 start
```

This will:
- Pull necessary Docker images (first time only)
- Start all Supabase services
- Initialize the database with migrations
- Display connection details

### 5. Verify Setup

After successful startup, you'll see:

```
Started supabase local development setup.

         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
  S3 Storage URL: http://127.0.0.1:54321/storage/v1/s3
         MCP URL: http://127.0.0.1:54321/mcp
    Database URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
     Mailpit URL: http://127.0.0.1:54324
```

## Environment Variables

Ensure your `.env.local` file has the correct Supabase configuration:

```env
# Supabase LOCAL instance
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<get-from-supabase-start-output>
SUPABASE_SERVICE_ROLE_KEY=<get-from-supabase-start-output>

# Database
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

**Note:** The `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are displayed when you run `npx supabase start`. These are default local development keys and are safe to use locally, but **never commit production keys to the repository**.

## Common Commands

```bash
# Start Supabase
npx supabase@2.58.5 start

# Stop Supabase
npx supabase@2.58.5 stop

# Check status
npx supabase@2.58.5 status

# Reset database (WARNING: deletes all data)
npx supabase@2.58.5 db reset

# Open Supabase Studio (database UI)
open http://127.0.0.1:54323

# View database migrations
npx supabase@2.58.5 migration list

# Create new migration
npx supabase@2.58.5 migration new migration_name
```

## Troubleshooting

### "command not found: supabase"

Use `npx supabase@2.58.5` instead of just `supabase`.

### "connect ECONNREFUSED 127.0.0.1:54322"

This means Supabase is not running. Start it with:

```bash
npx supabase@2.58.5 start
```

### "Cannot connect to the Docker daemon"

Docker Desktop is not running. Open Docker Desktop and wait for it to fully start.

### "failed to parse config: 'auth.third_party.clerk' has invalid keys"

You're using an older version of Supabase CLI. Update to v2.58.5+:

```bash
npx supabase@2.58.5 start
```

### Configuration Error: "auth.third_party.clerk is enabled but without a domain"

The `domain` field is required in `supabase/config.toml`:

```toml
[auth.third_party.clerk]
enabled = true
domain = "your-clerk-domain.clerk.accounts.dev"  # Required!
```

## Development Workflow

1. **Start Docker Desktop**
2. **Start Supabase**: `npx supabase@2.58.5 start`
3. **Start Next.js dev server**: `npm run dev`
4. **Develop your application**
5. **Stop Supabase when done**: `npx supabase@2.58.5 stop`

## Accessing Services

- **Supabase Studio (Database UI)**: http://127.0.0.1:54323
- **Mailpit (Email testing)**: http://127.0.0.1:54324
- **PostgreSQL**: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- **REST API**: http://127.0.0.1:54321

## Data Persistence

Local Supabase data is stored in Docker volumes. Your data persists between `stop` and `start` commands.

To view volumes:

```bash
docker volume ls --filter label=com.supabase.cli.project=CodeDetailsWeb
```

To completely remove all data:

```bash
npx supabase@2.58.5 stop --no-backup
```

## Production Setup

For production, replace the local Supabase configuration with your hosted Supabase project:

1. Create a project at https://supabase.com
2. Update `.env.production` with your project URL and keys
3. Configure Clerk integration in Supabase Dashboard under **Authentication > Third-party providers**

## Additional Resources

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Clerk + Supabase Integration](https://clerk.com/docs/integrations/databases/supabase)
- [Local Development Guide](https://supabase.com/docs/guides/local-development)
