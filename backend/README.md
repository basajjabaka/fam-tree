# Automatic User IDs Update

## Overview
This feature automatically updates the `VITE_USER_IDS` environment variable in the `.env` file with user IDs from the MongoDB database. This eliminates the need to manually enter user IDs in the `.env` file.

## How It Works

1. When the backend server starts, it runs the `update_env_ids.js` script.
2. The script connects to the MongoDB database and retrieves all user IDs from the `basajja.budimbe` collection.
3. It then updates the `VITE_USER_IDS` environment variable in the `.env` file with these IDs.
4. The frontend application uses these IDs to fetch and display user data.

## Files

- `update_env_ids.js`: Script that fetches user IDs from the database and updates the `.env` file.
- `index.js`: Modified to run the `update_env_ids.js` script when the server starts.

## Usage

1. Start the backend server: `node index.js`
2. The server will automatically update the `.env` file with user IDs from the database.
3. Start the frontend application: `npm run dev`
4. The frontend will use the updated `VITE_USER_IDS` to fetch and display user data.

## Troubleshooting

If the user IDs are not being updated correctly:

1. Check if the backend server is running and connected to the database.
2. Check if there are any users in the database.
3. Check the console output for any error messages.
4. Try running the `update_env_ids.js` script manually: `node update_env_ids.js`