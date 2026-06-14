import { handlers } from "@/lib/auth";

// Expose the NextAuth GET and POST handlers to the Next.js App Router
export const { GET, POST } = handlers;