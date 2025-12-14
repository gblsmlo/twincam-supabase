'use server'

import { failure, type Result, success } from '@/shared/errors/result'
import { productRepository } from '../repository/product-drizzle-repository'
import { productCreateSchema } from '../schemas'
import type { Product, ProductInsert } from '../types'

type CreateProductOutput = {
	product: Product
}

export const createProductAction = async (
	formData: ProductInsert,
): Promise<Result<CreateProductOutput>> => {
	const validated = productCreateSchema.safeParse(formData)

	if (!validated.success) {
		return failure({
			details: validated.error.issues,
			error: validated.error.name,
			message: 'Dados inválidos. Verifique os campos e tente novamente.',
			type: 'VALIDATION_ERROR',
		})
	}

	try {
		const repository = productRepository()

		const product = await repository.create(validated.data)

		return success({
			product,
		})
	} catch (error) {
		if (error instanceof Error) {
			return failure({
				error: error.name,
				message: error.message || 'Não foi possível criar o produto.',
				type: 'DATABASE_ERROR',
			})
		}

		return failure({
			error: 'Erro desconhecido',
			message: 'Ocorreu um erro inesperado ao criar o produto.',
			type: 'UNKNOWN_ERROR',
		})
	}
}
