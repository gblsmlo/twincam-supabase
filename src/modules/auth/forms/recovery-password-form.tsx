'use client'

import { Alert, AlertDescription } from '@components/ui/alert'
import { Button } from '@components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@components/ui/form'
import { Input } from '@components/ui/input'
import { Spinner } from '@components/ui/spiner'
import { zodResolver } from '@hookform/resolvers/zod'
import { isFailure, isSuccess } from '@shared/errors/result'
import { Activity, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { recoveryPasswordAction } from '../actions/recovery-password-action'
import { type RecoveryPasswordFormData, recoveryPasswordSchema } from '../schemas'

export function RecoveryPasswordForm() {
	const [isPending, startTransition] = useTransition()

	const form = useForm<RecoveryPasswordFormData>({
		defaultValues: {
			email: '',
		},
		resolver: zodResolver(recoveryPasswordSchema),
	})

	const isSubmitPending = isPending || form.formState.isSubmitting

	const onSubmit = (formData: RecoveryPasswordFormData) => {
		form.clearErrors()

		startTransition(async () => {
			const result = await recoveryPasswordAction(formData)

			if (isFailure(result)) {
				form.setError('root', {
					message: result.message,
				})

				toast.error(result.error || 'Ocorreu um erro', {
					description: result.message,
				})
			}

			if (isSuccess(result)) {
				toast.success('Email de recuperação enviado!')
				form.reset()
			}
		})
	}

	return (
		<Form {...form}>
			<form className="flex flex-col gap-10" onSubmit={form.handleSubmit(onSubmit)}>
				<div className="grid gap-6">
					{form.formState.errors.root && (
						<Alert variant="destructive">
							<AlertDescription>{form.formState.errors.root.message}</AlertDescription>
						</Alert>
					)}
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input autoComplete="email" type="email" {...field} disabled={isSubmitPending} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button disabled={isSubmitPending} type="submit">
						<Activity mode={isSubmitPending ? 'visible' : 'hidden'}>
							<Spinner />
						</Activity>
						Enviar email
					</Button>
				</div>
			</form>
		</Form>
	)
}
