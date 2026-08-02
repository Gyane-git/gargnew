import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/account",
    signUp: "/account/signup",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Always redirect to /dashboard after sign-in
      return "/dashboard";
    },
  },
});

/**
 * @swagger
 * /api/auth/{...nextauth}:
 *   get:
 *     summary: NextAuth.js catch-all handler (Google OAuth provider, JWT session strategy). Handles session, signin, signout, callback, csrf and providers routes managed by NextAuth. See NextAuth.js docs for the full sub-route behavior.
 *     tags: [Auth]
 *     responses:
 *       200: { description: Response shape depends on the NextAuth sub-route requested (session, csrf, providers, etc.). }
 *   post:
 *     summary: NextAuth.js catch-all handler (Google OAuth provider, JWT session strategy). Handles signin/signout/callback POST actions managed by NextAuth.
 *     tags: [Auth]
 *     responses:
 *       200: { description: Response shape depends on the NextAuth sub-route requested. }
 */
export { handler as GET, handler as POST };
