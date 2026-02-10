# Database Migration Guide

This guide explains how to run database migrations for the Zipties application.

## Migration Files

The migration system uses SQL files from the `../migration-script` directory in the following order:

1. **Create_tables.sql** - Creates all database tables
2. **Functions.sql** - Inserts seed data and initial setup
3. **Auth_functions.sql** - Authentication-related functions
4. **User_functions.sql** - User management functions
5. **Logs_functions.sql** - Logging and rate limiting functions
6. **Messaging_functions.sql** - Chat/messaging functions

## Available Commands

### Run Migrations
```bash
npm run migrate
```
Executes all pending migrations in the correct order. Tracks executed migrations in the `sql_migrations` table.

### Reset Database
```bash
npm run migrate:reset
```
Drops all tables and functions, giving you a clean slate. Useful for development/testing.

### Check Migration Status
```bash
npm run migrate:status
```
Shows which migrations have been executed and which are pending.

## Migration Order

The system enforces a specific execution order to ensure dependencies are met:

1. **Tables First** - Create_tables.sql must run before any functions
2. **Seed Data** - Functions.sql inserts initial data
3. **Functions** - All function files can run in any order after tables exist

## Features

- **Idempotent** - Safe to run multiple times (skips already executed migrations)
- **Transactional** - Each migration runs in a transaction (rolls back on failure)
- **Tracked** - Execution history stored in `sql_migrations` table
- **Ordered** - Ensures correct dependency order

## Development Workflow

1. **Fresh Database**: `npm run migrate:reset` then `npm run migrate`
2. **Update Functions**: Edit SQL files, then `npm run migrate`
3. **Check Status**: `npm run migrate:status` to see current state

## Important Notes

- Always backup production databases before running migrations
- The migration system creates a `sql_migrations` table to track execution
- Functions are dropped and recreated when re-running migrations
- The reset command drops ALL data - use with caution!

## Troubleshooting

If a migration fails:
1. Check the error message for SQL syntax issues
2. Ensure previous migrations completed successfully
3. Use `npm run migrate:status` to see current state
4. If needed, reset and start fresh with `npm run migrate:reset`
