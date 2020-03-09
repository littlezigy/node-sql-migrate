# SQL Migrate

This is a very basic migration tool used to sync tables between environments (eg, production, staging, development).

Make sure you set your environment variable (process.env.NODE_ENV.

## How to Use
- Install npm package: `npm i postgresorm`
- Create a folder `SQL` in the root of your Node.js application.
- Create another folder `migrations`. This is where you will store your migration files.
- Inside the `migrations` folder, create files `1-migrate.sql`, `2-migrate.sql` and so on. Do not redo previous migration files.
