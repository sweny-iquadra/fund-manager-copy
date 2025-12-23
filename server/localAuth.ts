import type { Express, RequestHandler } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { storage } from "./storage";

// Schema for registration and login
const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const JWT_SECRET =
  process.env.JWT_SECRET || "dev-jwt-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d";

function generateTokens(user: any) {
  const payload = {
    sub: user.id,
    email: user.email,
    first_name: user.firstName,
    last_name: user.lastName,
    profile_image_url: user.profileImageUrl,
    is_admin: user.isAdmin,
    iat: Math.floor(Date.now() / 1000),
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: "15m", // Short-lived access token
  });

  const refreshToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN, // Long-lived refresh token
  });

  return { accessToken, refreshToken };
}

export function setupLocalAuth(app: Express) {
  // Registration endpoint
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 12);

      // Create user
      const user = await storage.upsertUser({
        id: Date.now().toString(), // Simple ID generation for local dev
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        profileImageUrl: null,
        passwordHash: hashedPassword,
        authProvider: "local",
      });

      // Generate JWT tokens
      const { accessToken, refreshToken } = generateTokens(user);

      res.json({
        message: "Registration successful",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);

      // Find user
      const user = await storage.getUserByEmail(validatedData.email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(
        validatedData.password,
        user.passwordHash
      );
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate JWT tokens
      const { accessToken, refreshToken } = generateTokens(user);

      res.json({
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Token refresh endpoint
  app.post("/api/auth/refresh", async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token required" });
      }

      const decoded = jwt.verify(refreshToken, JWT_SECRET) as any;
      const user = await storage.getUser(decoded.sub);

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const tokens = generateTokens(user);
      res.json(tokens);
    } catch (error) {
      res.status(401).json({ message: "Invalid refresh token" });
    }
  });

  // Logout endpoint (for client-side token removal)
  app.post("/api/auth/logout", (req, res) => {
    res.json({ message: "Logged out successfully" });
  });

  // // For compatibility with Replit auth, still provide these routes
  // app.get("/api/login", (req, res) => {
  //   res.redirect("/login");
  // });

  // app.get("/api/logout", (req, res) => {
  //   res.redirect("/");
  // });
}

// Authentication middleware
export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access token required" });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Add user claims to request object
    req.user = {
      claims: {
        sub: decoded.sub,
        email: decoded.email,
        first_name: decoded.first_name,
        last_name: decoded.last_name,
        profile_image_url: decoded.profile_image_url,
        is_admin: decoded.is_admin,
      },
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res
        .status(401)
        .json({ message: "Token expired", code: "TOKEN_EXPIRED" });
    }
    return res.status(401).json({ message: "Invalid token" });
  }
};
