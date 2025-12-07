'use client'

import { useForm } from 'react-hook-form'

interface Input {
	actions: (data: any) => void
}
export function useFormState() {
	const form = useForm({
		defaultValues: {
			email: '',
			password: '',
		},
	})

	return form
}
