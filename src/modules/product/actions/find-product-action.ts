'use server'

import type { Result } from '@/shared/errors'
import { productRepository } from '../repository/product-drizzle-repository'
import type { Product } from '../types'

type Output = {
	data: Product[]
}

export const findProductAction = async (): Promise<Result<Output>> => {
	const repository = productRepository()

	const products = await repository.findAll()

	if (!products) {
	}

	return {
		data: products,
	}
}
