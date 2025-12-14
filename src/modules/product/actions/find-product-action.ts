'use server'

import { failure, type Result, success } from '@/shared/errors/result'
import { productRepository } from '../repository/product-drizzle-repository'
import type { Product } from '../types'

type FindProductOutput = {
	products: Product[]
}

export const findProductAction = async (): Promise<Result<FindProductOutput>> => {
	try {
		const repository = productRepository()

		const products = await repository.findAll()

		return success({
			products,
		})
	} catch (error) {
		if (error instanceof Error) {
			return failure({
				error: error.name,
				message: error.message || 'Não foi possível buscar os produtos.',
				type: 'DATABASE_ERROR',
			})
		}

		return failure({
			error: 'Erro desconhecido',
			message: 'Ocorreu um erro inesperado ao buscar os produtos.',
			type: 'UNKNOWN_ERROR',
		})
	}
}
