'use client'

import { Alert, AlertDescription } from '@components/ui/alert'
import { Button } from '@components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@components/ui/form'
import { Input } from '@components/ui/input'
import { Spinner } from '@components/ui/spiner'
import { zodResolver } from '@hookform/resolvers/zod'
import { isFailure, isSuccess } from '@shared/errors/result'
import { sleep } from '@utils/sleep'
import { redirect } from 'next/navigation'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { signUpAction } from '../actions'
import { GoogleProviderButton } from '../components/google-provider-button'
import { ProviderSeparetor } from '../components/separetor'
import { type SignUpFormData, signUpSchema } from '../schemas'

export function SignUpForm() {
	const [isPending, startTransition] = useTransition()

	const form = useForm<SignUpFormData>({
		defaultValues: {
			email: '',
			name: '',
			password: '',
		},
		resolver: zodResolver(signUpSchema),
	})

	const isSubmitPending = isPending || form.formState.isSubmitting

	const signUpSubmit = (formData: SignUpFormData) => {
		form.clearErrors()

		startTransition(async () => {
			const result = await signUpAction(formData)

			if (isFailure(result)) {
				form.setError('root', {
					message: result.message,
				})

				toast.error(result.error || 'Ocorreu um erro', {
					description: result.message,
				})
			}

			if (isSuccess(result)) {
				toast.success('Conta criada com sucesso!')

				await sleep(2000)

				redirect(result.data.redirectTo)
			}
		})
	}

	return (
		<Form {...form}>
			<form className="flex flex-col gap-10" onSubmit={form.handleSubmit(signUpSubmit)}>
				<div className="grid gap-6">
					{form.formState.errors.root && (
						<Alert variant="destructive">
							<AlertDescription>{form.formState.errors.root.message}</AlertDescription>
						</Alert>
					)}
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Name</FormLabel>
								<FormControl>
									<Input autoComplete="name" type="text" {...field} disabled={isSubmitPending} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
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
					<FormField
						control={form.control}
						name="password"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Senha</FormLabel>
								<FormControl>
									<Input
										autoComplete="new-password"
										type="password"
										{...field}
										disabled={isSubmitPending}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button disabled={isSubmitPending} type="submit">
						{isSubmitPending && <Spinner />}
						Criar conta
					</Button>
				</div>

				<ProviderSeparetor />

				<GoogleProviderButton />
			</form>
		</Form>
	)
}
