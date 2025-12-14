'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { isFailure, isSuccess } from '@/shared/errors/result'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { createProductAction } from '../actions'
import { productCreateSchema } from '../schemas'
import type { ProductInsert } from '../types'

type CreateProductFormProps = {
	onSuccess?: () => void
	submitButtonId?: string
}

export function CreateProductForm({ onSuccess, submitButtonId }: CreateProductFormProps) {
	const [isPending, startTransition] = useTransition()
	const router = useRouter()

	const form = useForm<ProductInsert>({
		defaultValues: {
			description: '',
			name: '',
			priceId: undefined,
		},
		resolver: zodResolver(productCreateSchema),
	})

	const isSubmitPending = isPending || form.formState.isSubmitting

	const handleSubmit = (formData: ProductInsert) => {
		form.clearErrors()

		startTransition(async () => {
			const result = await createProductAction(formData)

			if (isFailure(result)) {
				form.setError('root', {
					message: result.message,
				})

				const errorMessage =
					typeof result.error === 'string' ? result.error : 'Erro ao criar produto'
				toast.error(errorMessage, {
					description: result.message,
				})
			}

			if (isSuccess(result)) {
				toast.success('Produto criado com sucesso!', {
					description: `O produto "${result.data.product.name}" foi criado.`,
				})

				form.reset()
				router.refresh()

				if (onSuccess) {
					onSuccess()
				}
			}
		})
	}

	return (
		<Form {...form}>
			<form
				className="flex flex-col gap-6"
				id={submitButtonId}
				onSubmit={form.handleSubmit(handleSubmit)}
			>
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
							<FormLabel>Nome do Produto</FormLabel>
							<FormControl>
								<Input
									placeholder="Digite o nome do produto"
									type="text"
									{...field}
									disabled={isSubmitPending}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Descrição</FormLabel>
							<FormControl>
								<Input
									placeholder="Digite a descrição do produto"
									type="text"
									{...field}
									disabled={isSubmitPending}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="priceId"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Price ID (opcional)</FormLabel>
							<FormControl>
								<Input
									placeholder="UUID do preço"
									type="text"
									{...field}
									disabled={isSubmitPending}
									value={field.value || ''}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</form>
		</Form>
	)
}
