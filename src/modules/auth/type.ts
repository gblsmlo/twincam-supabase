export interface UserAuth {
	id: string
	name: string
	email: string
	isPlatformAdmin: boolean
}

export interface UserSupabase {
	id: string
	email?: string
	user_metadata?: Record<string, unknown> & {
		username?: string
	}
}
