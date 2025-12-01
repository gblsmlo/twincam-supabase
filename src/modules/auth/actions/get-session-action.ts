'use server'

import { authServer } from '@infra/auth/server'
import { headers } from 'next/headers'
import { cache } from 'react'

export const getSessionAction = cache(async () => {
	return await authServer.api.getSession({
		headers: await headers(),
	})
})
