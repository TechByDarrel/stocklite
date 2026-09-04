// Expo resolves database.web.ts or database.native.ts before this fallback.
export { closeDatabase, getActiveUserId, getDatabase, initializeDatabase, setActiveUser } from './database.native';