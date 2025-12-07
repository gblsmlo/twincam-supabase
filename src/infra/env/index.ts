import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
	client: {
		NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string(),
		NEXT_PUBLIC_SUPABASE_URL: z.url(),
	},
	runtimeEnv: {
		DATABASE_URL: process.env.DATABASE_URL,
		GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
		GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
		NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
		NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
		NODE_ENV: process.env.NODE_ENV,
		PORT: process.env.PORT,
		SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
	},
	server: {
		DATABASE_URL: z
			.string()
			.refine((url) => url.startsWith('postgresql://') || url.startsWith('postgres://'), {
				message: 'DATABASE_URL must start with postgresql:// or postgres://',
			}),
		GOOGLE_CLIENT_ID: z.string(),
		GOOGLE_CLIENT_SECRET: z.string(),
		NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
		PORT: z.coerce.number().min(1).max(65535).default(3333),
		SUPABASE_SECRET_KEY: z.string(),
	},
})
