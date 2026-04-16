import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "./logger";
import { Errors } from "./errors";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;

        if (!email || !password) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email));

        if (!user) {
          logger.warn("auth.login_failed", { reason: "user_not_found" });
          return null;
        }

        // 账号锁定检查
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          logger.warn("auth.login_blocked", { userId: user.id, reason: "account_locked" });
          return null;
        }

        // 账号禁用检查
        if (user.status === "disabled") {
          logger.warn("auth.login_blocked", { userId: user.id, reason: "account_disabled" });
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (!isValid) {
          // 递增失败计数，5次后锁定15分钟
          const newCount = user.failedLoginCount + 1;
          const lockUntil = newCount >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
          await db
            .update(users)
            .set({
              failedLoginCount: newCount,
              lockedUntil: lockUntil,
            })
            .where(eq(users.id, user.id));

          logger.warn("auth.login_failed", {
            userId: user.id,
            reason: "wrong_password",
            failedCount: newCount,
          });
          return null;
        }

        // 登录成功，重置失败计数
        await db
          .update(users)
          .set({ failedLoginCount: 0, lockedUntil: null })
          .where(eq(users.id, user.id));

        logger.info("auth.login_success", { userId: user.id });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24小时
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = (user as unknown as { role: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        (session.user as unknown as { role: string }).role = token.role as string;
      }
      return session;
    },
    async authorized({ auth: session, request }) {
      const isLoggedIn = !!session?.user;
      const isOnLogin = request.nextUrl.pathname.startsWith("/login");
      const isOnRegister = request.nextUrl.pathname.startsWith("/register");
      const isAuthRoute = isOnLogin || isOnRegister;

      if (isAuthRoute) {
        if (isLoggedIn) return Response.redirect(new URL("/", request.nextUrl));
        return true;
      }

      if (!isLoggedIn) return false; // redirect to /login

      // JWT吊销检查：token签发时间 < token_invalidated_at
      const userId = session.user?.id;
      if (userId) {
        const [user] = await db
          .select({ tokenInvalidatedAt: users.tokenInvalidatedAt })
          .from(users)
          .where(eq(users.id, userId));

        if (user?.tokenInvalidatedAt) {
          const tokenIssuedAt = (session as unknown as { iat?: number }).iat;
          if (tokenIssuedAt && tokenIssuedAt < user.tokenInvalidatedAt.getTime() / 1000) {
            return false; // token已吊销
          }
        }
      }

      return true;
    },
  },
});

// 辅助函数：获取当前会话用户ID（在Server Action中使用）
export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw Errors.UNAUTHORIZED;
  }
  return session.user as { id: string; email: string; name: string; role: string };
}
