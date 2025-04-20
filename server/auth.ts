import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends User {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export async function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "finedge-stock-tracker-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 60 * 60 * 24 * 1000, // 1 day
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, password, firstName, lastName, email, role } = req.body;
      
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Default to user role if not specified
      const userRole = role || "user";
      
      const user = await storage.createUser({
        username,
        password: await hashPassword(password),
        firstName,
        lastName,
        email,
        role: userRole,
      });

      req.login(user, (err) => {
        if (err) return next(err);
        
        // Initialize portfolio with starting cash (only for regular users)
        if (userRole === "user") {
          storage.createPortfolio(user.id, 10000);
        }
        
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });

  // Regular user login
  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    // If an admin tries to log in via user login, deny access
    if (req.user && req.user.role === "admin") {
      req.logout((err) => {
        if (err) console.error(err);
        return res.status(403).json({ message: "Please use admin login" });
      });
    } else {
      res.status(200).json(req.user);
    }
  });
  
  // Admin login
  app.post("/api/admin/login", passport.authenticate("local"), (req, res) => {
    // Check if the user has admin role
    if (req.user && req.user.role === "admin") {
      res.status(200).json(req.user);
    } else {
      req.logout((err) => {
        if (err) console.error(err);
        return res.status(403).json({ message: "Unauthorized. Admin access required." });
      });
    }
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  app.post("/api/forgot-password", async (req, res) => {
    const { email } = req.body;
    
    // In a real app, we would send an email with a reset link
    // For this demo, we'll just acknowledge the request
    
    res.status(200).json({
      message: "If an account with that email exists, a password reset link has been sent.",
    });
  });
}
