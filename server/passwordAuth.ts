import bcrypt from "bcryptjs";
import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { z } from "zod";

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

// Verify password
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Register new user with password
export async function registerUser(req: Request, res: Response) {
  try {
    const { email, password, firstName, lastName } = registerSchema.parse(
      req.body
    );
    console.log("Registering user here before existing check");

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    console.log("Registering user here after existing check 1");
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    console.log("Registering user here after existing check 2 ");
    // Hash password
    const passwordHash = await hashPassword(password);

    console.log("Registering user here after password hash");

    // Create user
    const user = await storage.upsertUser({
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email,
      firstName,
      lastName,
      passwordHash,
      authProvider: "local",
      emailVerified: false,
    });

    console.log("user created:", user);

    // Create session (simplified for development)
    req.session = req.session || {};
    (req.session as any).user = {
      claims: {
        sub: user.id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        profile_image_url: user.profileImageUrl,
      },
    };

    console.log("created session:", req.session);

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Invalid input data", errors: error.errors });
    }
    res.status(500).json({ message: "Registration failed" });
  }
}

// Login with email/password
export async function loginUser(req: Request, res: Response) {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find user by email
    const user = await storage.getUserByEmail(email);
    if (!user || !user.passwordHash || user.authProvider !== "local") {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create session
    req.session = req.session || {};
    (req.session as any).user = {
      claims: {
        sub: user.id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        profile_image_url: user.profileImageUrl,
      },
    };

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Invalid input data", errors: error.errors });
    }
    res.status(500).json({ message: "Login failed" });
  }
}

// Middleware to check authentication (supports both OAuth and password)
export function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Check for OAuth session (existing Replit auth)
  if (req.user && req.user.claims) {
    return next();
  }

  // Check for password-based session
  if (
    req.session &&
    (req.session as any).user &&
    (req.session as any).user.claims
  ) {
    req.user = (req.session as any).user;
    return next();
  }

  // No valid authentication found
  return res.status(401).json({ message: "Unauthorized" });
}
