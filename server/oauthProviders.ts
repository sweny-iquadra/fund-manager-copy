import type { Express, RequestHandler } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import appleSignin from "apple-signin-auth";

const JWT_SECRET =
  process.env.JWT_SECRET || "dev-jwt-secret-key-change-in-production";

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
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
}

export function setupOAuthProviders(app: Express) {
  // Initialize passport
  app.use(passport.initialize());

  // Passport serialization (not used for JWT but required by passport)
  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL:
            process.env.NODE_ENV === "production"
              ? `https://${process.env.REPLIT_DOMAINS}/api/auth/google/callback`
              : "http://localhost:5000/api/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
              return done(new Error("No email found in Google profile"));
            }

            // Check if user exists
            let user = await storage.getUserByEmail(email);

            if (!user) {
              // Create new user
              user = await storage.createUser({
                id: `google_${profile.id}`,
                email,
                firstName: profile.name?.givenName || "",
                lastName: profile.name?.familyName || "",
                profileImageUrl: profile.photos?.[0]?.value || null,
                authProvider: "google",
                emailVerified: true,
                passwordHash: null, // OAuth users don't have passwords
              });
            } else if (user.authProvider !== "google") {
              // Link existing account and update profile info
              user = await storage.updateUser(user.id, {
                authProvider: "google",
                emailVerified: true,
                firstName: profile.name?.givenName || user.firstName,
                lastName: profile.name?.familyName || user.lastName,
                profileImageUrl:
                  profile.photos?.[0]?.value || user.profileImageUrl,
              });
            } else {
              // User already has Google auth - update profile info in case it changed
              user = await storage.updateUser(user.id, {
                firstName: profile.name?.givenName || user.firstName,
                lastName: profile.name?.familyName || user.lastName,
                profileImageUrl:
                  profile.photos?.[0]?.value || user.profileImageUrl,
              });
            }

            return done(null, user);
          } catch (error) {
            return done(error);
          }
        }
      )
    );
  }

  // Facebook OAuth Strategy
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: process.env.FACEBOOK_APP_ID,
          clientSecret: process.env.FACEBOOK_APP_SECRET,
          callbackURL: "/api/auth/facebook/callback",
          profileFields: ["id", "emails", "name", "picture.type(large)"],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
              return done(new Error("No email found in Facebook profile"));
            }

            // Check if user exists
            let user = await storage.getUserByEmail(email);

            if (!user) {
              // Create new user
              user = await storage.createUser({
                id: `facebook_${profile.id}`,
                email,
                firstName: profile.name?.givenName || "",
                lastName: profile.name?.familyName || "",
                profileImageUrl: profile.photos?.[0]?.value || null,
                authProvider: "facebook",
                emailVerified: true,
                passwordHash: null, // OAuth users don't have passwords
              });
            } else if (user.authProvider !== "facebook") {
              // Link existing account
              user = await storage.updateUser(user.id, {
                authProvider: "facebook",
                emailVerified: true,
              });
            }

            return done(null, user);
          } catch (error) {
            return done(error);
          }
        }
      )
    );
  }

  // OAuth Routes

  // Google OAuth Routes
  app.get(
    "/api/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", { session: false }),
    async (req: any, res) => {
      try {
        const user = req.user;
        const tokens = generateTokens(user);

        // Check if this is a web browser or mobile app
        const userAgent = req.get("User-Agent") || "";
        const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);

        if (isMobile && process.env.NODE_ENV === "production") {
          // For mobile app, redirect to deep link
          const redirectUrl = `${
            process.env.MOBILE_APP_SCHEME || "financeapp"
          }://auth/callback?accessToken=${tokens.accessToken}&refreshToken=${
            tokens.refreshToken
          }`;
          res.redirect(redirectUrl);
        } else {
          // For web browser (development), redirect to frontend with tokens as URL parameters
          const frontendUrl =
            process.env.NODE_ENV === "development"
              ? "http://localhost:5000"
              : `https://${process.env.REPLIT_DOMAINS}`;

          const redirectUrl = `${frontendUrl}/auth/callback?accessToken=${encodeURIComponent(
            tokens.accessToken
          )}&refreshToken=${encodeURIComponent(tokens.refreshToken)}`;
          res.redirect(redirectUrl);
        }
      } catch (error: any) {
        console.error("Google OAuth error:", error);
        const userAgent = req.get("User-Agent") || "";
        const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);

        if (isMobile && process.env.NODE_ENV === "production") {
          res.redirect(
            `${process.env.MOBILE_APP_SCHEME || "financeapp"}://auth/error`
          );
        } else {
          // Redirect to frontend with error
          const frontendUrl =
            process.env.NODE_ENV === "development"
              ? "http://localhost:5000"
              : `https://${process.env.REPLIT_DOMAINS}`;
          res.redirect(
            `${frontendUrl}/auth/error?message=${encodeURIComponent(
              error.message || "OAuth failed"
            )}`
          );
        }
      }
    }
  );

  // Facebook OAuth Routes
  app.get(
    "/api/auth/facebook",
    passport.authenticate("facebook", { scope: ["email"] })
  );

  app.get(
    "/api/auth/facebook/callback",
    passport.authenticate("facebook", { session: false }),
    async (req: any, res) => {
      try {
        const user = req.user;
        const tokens = generateTokens(user);

        // Check if this is a web browser or mobile app
        const userAgent = req.get("User-Agent") || "";
        const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);

        if (isMobile && process.env.NODE_ENV === "production") {
          // For mobile app, redirect to deep link
          const redirectUrl = `${
            process.env.MOBILE_APP_SCHEME || "financeapp"
          }://auth/callback?accessToken=${tokens.accessToken}&refreshToken=${
            tokens.refreshToken
          }`;
          res.redirect(redirectUrl);
        } else {
          // For web browser, redirect to frontend with tokens
          const frontendUrl =
            process.env.NODE_ENV === "development"
              ? "http://localhost:5000"
              : `https://${process.env.REPLIT_DOMAINS}`;

          const redirectUrl = `${frontendUrl}/auth/callback?accessToken=${encodeURIComponent(
            tokens.accessToken
          )}&refreshToken=${encodeURIComponent(tokens.refreshToken)}`;
          res.redirect(redirectUrl);
        }
      } catch (error: any) {
        const userAgent = req.get("User-Agent") || "";
        const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);

        if (isMobile && process.env.NODE_ENV === "production") {
          res.redirect(
            `${process.env.MOBILE_APP_SCHEME || "financeapp"}://auth/error`
          );
        } else {
          const frontendUrl =
            process.env.NODE_ENV === "development"
              ? "http://localhost:5000"
              : `https://${process.env.REPLIT_DOMAINS}`;
          res.redirect(
            `${frontendUrl}/auth/error?message=${encodeURIComponent(
              error.message || "OAuth failed"
            )}`
          );
        }
      }
    }
  );

  // Apple Sign In (Server-to-Server validation)
  app.post("/api/auth/apple", async (req, res) => {
    try {
      const { identityToken, authorizationCode } = req.body;

      if (!identityToken) {
        return res.status(400).json({ message: "Identity token required" });
      }

      // Verify Apple identity token
      const appleUser = await appleSignin.verifyIdToken(identityToken, {
        audience: process.env.APPLE_CLIENT_ID || "",
        ignoreExpiration: false,
      });

      const email = appleUser.email;
      if (!email) {
        return res.status(400).json({ message: "No email found in Apple ID" });
      }

      // Check if user exists
      let user = await storage.getUserByEmail(email);

      if (!user) {
        // Create new user - Apple doesn't provide names in subsequent logins
        user = await storage.createUser({
          id: `apple_${appleUser.sub}`,
          email,
          firstName: req.body.firstName || "",
          lastName: req.body.lastName || "",
          profileImageUrl: null,
          authProvider: "apple",
          emailVerified: true,
          passwordHash: null, // OAuth users don't have passwords
        });
      } else if (user.authProvider !== "apple") {
        // Link existing account
        user = await storage.updateUser(user.id, {
          authProvider: "apple",
          emailVerified: true,
        });
      }

      const tokens = generateTokens(user);

      res.json({
        message: "Apple Sign In successful",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } catch (error) {
      console.error("Apple Sign In error:", error);
      res.status(400).json({ message: "Apple Sign In failed" });
    }
  });

  // OAuth status endpoint for mobile apps
  app.get("/api/auth/providers", (req, res) => {
    const providers = {
      google: !!(
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ),
      facebook: !!(
        process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET
      ),
      apple: !!process.env.APPLE_CLIENT_ID,
    };

    res.json({ providers });
  });
}
