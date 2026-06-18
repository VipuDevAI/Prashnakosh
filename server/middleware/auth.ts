import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import type { AuthUser } from "@shared/schema";
import { getSessionTTL, extractTokenTimestamp } from "../lib/session-config";

const tokenUserCache = new Map<string, { user: AuthUser; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export { getSessionTTL } from "../lib/session-config";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorization header required" });
  }

  const token = authHeader.slice(7);
  
  if (!token) {
    return res.status(401).json({ error: "Invalid token format" });
  }

  const cached = tokenUserCache.get(token);
  if (cached && cached.expiry > Date.now()) {
    // Check session expiry even for cached tokens
    const tokenTs = extractTokenTimestamp(token);
    if (tokenTs) {
      const ttl = getSessionTTL(cached.user.role);
      if (Date.now() - tokenTs > ttl) {
        tokenUserCache.delete(token);
        return res.status(401).json({ error: "Session expired", code: "SESSION_EXPIRED" });
      }
    }
    req.user = cached.user;
    if (req.user.tenantId) {
      req.tenantId = req.user.tenantId;
    }
    return next();
  }

  const userIdMatch = token.match(/^token-([^-]+(?:-[^-]+)*)-\d+$/);
  if (!userIdMatch) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const userId = userIdMatch[1];
  const user = await storage.getUser(userId);
  
  if (!user || !user.active) {
    return res.status(401).json({ error: "User not found or inactive" });
  }

  // Check token expiry based on role
  const tokenTimestamp = extractTokenTimestamp(token);
  if (tokenTimestamp) {
    const ttl = getSessionTTL(user.role);
    if (Date.now() - tokenTimestamp > ttl) {
      return res.status(401).json({ error: "Session expired", code: "SESSION_EXPIRED" });
    }
  }

  // Fetch user's department assignments
  const deptAssignments = await storage.getUserDepartments(userId);
  const departmentIds = deptAssignments.map(a => a.departmentId);

  const authUser: AuthUser = {
    id: user.id,
    tenantId: user.tenantId,
    email: user.email,
    name: user.name,
    role: user.role,
    grade: user.grade || undefined,
    avatar: user.avatar,
    departmentIds,
    activeDepartmentId: departmentIds[0] || undefined,
  };

  tokenUserCache.set(token, { user: authUser, expiry: Date.now() + CACHE_TTL });

  req.user = authUser;
  if (authUser.tenantId) {
    req.tenantId = authUser.tenantId;
  }
  
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    
    next();
  };
}
