'use client'

import { Alert, AlertTitle } from '@/components/ui/alert'
import { Anchor } from '@/components/ui/anchor'
import { Button } from '@/components/ui/button'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
// import { Spinner } from '@/components/ui/spiner'
import { isFailure, isSuccess } from '@/shared/errors/result'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { redirect } from 'next/navigation'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { signInAction } from '../actions'
import { GoogleProviderButton } from '../components/google-provider-button'
import { ProviderSeparetor } from '../components/separetor'
import { useAuth } from '../hooks/use-auth'
import { type SignInFormData, signInSchema } from '../schemas'

export function SignInForm() {
	const [isPending, startTransition] = useTransition()
	const { refresh } = useAuth()

	const form = useForm<SignInFormData>({
		defaultValues: {
			email: '',
			password: '',
		},
		resolver: zodResolver(signInSchema),
	})

	const signUpSubmit = (formData: SignInFormData) => {
		form.clearErrors()

		startTransition(async () => {
			const result = await signInAction(formData)

			if (isFailure(result)) {
				form.setError('root', {
					message: result.message,
				})
			}

			if (isSuccess(result)) {
				await refresh()

				toast.success('Login realizado com sucesso!')
				redirect(result.data.redirectTo)
			}
		})
	}

	const isSubmitting = form.formState.isSubmitting || isPending

	return (
		<Form {...form}>
			<form className="flex flex-col gap-10" onSubmit={form.handleSubmit(signUpSubmit)}>
				<div className="grid gap-6">
					{form.formState.errors.root && (
						<Alert variant="destructive">
							<AlertTitle>{form.formState.errors.root.message}</AlertTitle>
						</Alert>
					)}
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input autoComplete="email" type="email" {...field} disabled={isSubmitting} />
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
								<FormLabel className="flex justify-between gap-1">
									Senha
									<span className="text-sm">
										<Anchor className="font-normal" href="/auth/recovery-password">
											Esqueceu sua senha?
										</Anchor>
									</span>
								</FormLabel>
								<FormControl>
									<Input
										autoComplete="new-password"
										type="password"
										{...field}
										disabled={isSubmitting}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button type="submit">
						{isSubmitting ? <Loader2 className="size-4 animate-spin" /> : 'Entrar'}
					</Button>

					<ProviderSeparetor />

					<GoogleProviderButton />
				</div>
			</form>
		</Form>
	)
}
