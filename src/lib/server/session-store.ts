/**
 * Session Store
 * In-memory storage for sessions and users
 * In production, use Redis or database
 */

import type { User } from "@/src/types";
import { randomBytes } from "crypto";

interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

// In-memory store (replace with Redis/database in production)
const sessionStore = new Map<string, Session>();
const userStore = new Map<string, User>();

// Cleanup expired sessions every hour
setInterval(() => {
  const now = new Date();
  sessionStore.forEach((session, sessionId) => {
    if (session.expiresAt < now) {
      sessionStore.delete(sessionId);
    }
  });
}, 60 * 60 * 1000);

/**
 * Generate secure session ID
 */
function generateSessionId(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Get or create user by email
 */
export async function getUserByEmail(email: string): Promise<User> {
  // Check if user exists
  let foundUser: User | null = null;
  for (const user of Array.from(userStore.values())) {
    if (user.email === email) {
      foundUser = user;
      break;
    }
  }

  if (foundUser) {
    return foundUser;
  }

  // Create new user
  const newUser: User = {
    id: randomBytes(16).toString("hex"),
    email,
    name: email.split("@")[0], // Default name from email
    role: "user",
    createdAt: new Date().toISOString(),
  };

  userStore.set(newUser.id, newUser);
  return newUser;
}

/**
 * Create user with name
 */
export async function createUser(email: string, name: string): Promise<User> {
  // Check if user already exists
  let existingUser: User | null = null;
  for (const user of Array.from(userStore.values())) {
    if (user.email === email) {
      existingUser = user;
      break;
    }
  }

  if (existingUser) {
    // Update name if provided
    if (name) {
      existingUser.name = name;
      userStore.set(existingUser.id, existingUser);
    }
    return existingUser;
  }

  // Create new user
  const newUser: User = {
    id: randomBytes(16).toString("hex"),
    email,
    name,
    role: "user",
    createdAt: new Date().toISOString(),
  };

  userStore.set(newUser.id, newUser);
  return newUser;
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  return userStore.get(userId) || null;
}

/**
 * Create a new session
 */
export async function createSession(user: User): Promise<string> {
  const sessionId = generateSessionId();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

  const session: Session = {
    id: sessionId,
    userId: user.id,
    expiresAt,
    createdAt: new Date(),
  };

  sessionStore.set(sessionId, session);
  return sessionId;
}

/**
 * Get session by ID
 */
export async function getSession(sessionId: string): Promise<Session | null> {
  return sessionStore.get(sessionId) || null;
}

/**
 * Get user from session
 */
export async function getUserFromSession(
  sessionId: string
): Promise<User | null> {
  const session = await getSession(sessionId);

  if (!session) {
    return null;
  }

  // Check expiration
  if (session.expiresAt < new Date()) {
    sessionStore.delete(sessionId);
    return null;
  }

  return getUserById(session.userId);
}

/**
 * Delete session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  sessionStore.delete(sessionId);
}
