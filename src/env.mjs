import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  /*
   * Serverside Environment variables, not available on the client.
   * Will throw if you access these variables on the client.
   */
  server: {
    // Add any server-side only environment variables here
    // DATABASE_URL: z.string().url(),
    // OPEN_AI_API_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    MS_AZURE_APP_SECRET: z.string().min(1).optional(),
    GOOGLE_APP_CLIENT_ID: z.string().min(1),
    GOOGLE_APP_CLIENT_SECRET: z.string().min(1),
  },
  /*
   * Environment variables available on the client (and server).
   *
   * 💡 You'll get type errors if these are not prefixed with NEXT_PUBLIC_.
   */
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_MS_AZURE_CLIENT_ID: z.string().min(1),
    NEXT_PUBLIC_MS_AZURE_REDIRECT_URI: z.url(),
    NEXT_PUBLIC_GOOGLE_REDIRECT_URI: z.url(),
  },
  /*
   * Due to how Next.js bundles environment variables on Edge and Client,
   * we need to manually destructure them to make sure all are included in bundle.
   *
   * 💡 You'll get type errors if not all variables from `server` & `client` are included here.
   */
  runtimeEnv: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    MS_AZURE_APP_SECRET: process.env.MS_AZURE_APP_SECRET,
    NEXT_PUBLIC_MS_AZURE_CLIENT_ID: process.env.NEXT_PUBLIC_MS_AZURE_CLIENT_ID,
    NEXT_PUBLIC_MS_AZURE_REDIRECT_URI:
      process.env.NEXT_PUBLIC_MS_AZURE_REDIRECT_URI,
    NEXT_PUBLIC_GOOGLE_REDIRECT_URI:
      process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI,
    GOOGLE_APP_CLIENT_ID: process.env.GOOGLE_APP_CLIENT_ID,
    GOOGLE_APP_CLIENT_SECRET: process.env.GOOGLE_APP_CLIENT_SECRET,
  },
});
