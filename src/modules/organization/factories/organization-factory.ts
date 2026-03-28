import { failure, isFailure, type Result, success } from '@/shared/errors/result'
import type { OrganizationRepository } from '../repository/organization-repository'
import type { Organization, OrganizationInsert, OrganizationInsertFull } from '../types'

const SLUG_REGEX = /^[a-z0-9-]+$/
const SLUG_MIN_LENGTH = 3
const SLUG_MAX_LENGTH = 50

export class OrganizationFactory {
	/**
	 * Cria input para organização root (sem parent).
	 */
	static createRootOrganization(
		name: string,
		slug: string,
		ownerId: string,
	): OrganizationInsertFull {
		return {
			hierarchyLevel: 1,
			hierarchyPath: '',
			name,
			ownerId,
			parentOrganizationId: null,
			slug,
		}
	}

	/**
	 * Cria input para sub-account (filha de organização existente).
	 * Computa hierarchyPath e hierarchyLevel a partir do parent.
	 */
	static createSubAccount(
		parentOrganization: Organization,
		name: string,
		slug: string,
		ownerId: string,
	): OrganizationInsertFull {
		const hierarchyPath = parentOrganization.hierarchyPath
			? `${parentOrganization.hierarchyPath}.${parentOrganization._id}`
			: parentOrganization._id

		return {
			hierarchyLevel: parentOrganization.hierarchyLevel + 1,
			hierarchyPath,
			name,
			ownerId,
			parentOrganizationId: parentOrganization._id,
			slug,
		}
	}

	/**
	 * Valida inputs de criação de organização.
	 */
	static validateOrganization(input: {
		name: string
		slug: string
		ownerId: string
	}): Result<void> {
		if (!input.name || input.name.trim().length === 0) {
			return failure({
				message: 'O nome da organização não pode ser vazio.',
				type: 'VALIDATION_ERROR',
			})
		}

		if (!input.slug || !SLUG_REGEX.test(input.slug)) {
			return failure({
				message: 'O slug deve conter apenas letras minúsculas, números e hífens.',
				type: 'VALIDATION_ERROR',
			})
		}

		if (input.slug.length < SLUG_MIN_LENGTH || input.slug.length > SLUG_MAX_LENGTH) {
			return failure({
				message: `O slug deve ter entre ${SLUG_MIN_LENGTH} e ${SLUG_MAX_LENGTH} caracteres.`,
				type: 'VALIDATION_ERROR',
			})
		}

		if (!input.ownerId) {
			return failure({
				message: 'O ID do proprietário é obrigatório.',
				type: 'VALIDATION_ERROR',
			})
		}

		return success(undefined)
	}

	/**
	 * Cria organização com validação completa e verificação de unicidade.
	 * Para root: parentId omitido ou undefined.
	 * Para sub-account: parentId informado.
	 */
	static async createOrganizationWithValidation(
		input: {
			name: string
			slug: string
			ownerId: string
			parentId?: string
		},
		organizationRepository: OrganizationRepository,
	): Promise<Result<OrganizationInsert | OrganizationInsertFull>> {
		const validationResult = OrganizationFactory.validateOrganization(input)
		if (isFailure(validationResult)) {
			return validationResult
		}

		const existing = await organizationRepository.findBySlug(input.slug)
		if (existing) {
			return failure({
				message: 'Esse slug de organização já está em uso.',
				type: 'VALIDATION_ERROR',
			})
		}

		if (input.parentId) {
			const parent = await organizationRepository.findByOwnerId(input.parentId)
			if (!parent) {
				return failure({
					message: 'Organização pai não encontrada.',
					type: 'NOT_FOUND_ERROR',
				})
			}

			return success(
				OrganizationFactory.createSubAccount(parent, input.name, input.slug, input.ownerId),
			)
		}

		return success(
			OrganizationFactory.createRootOrganization(input.name, input.slug, input.ownerId),
		)
	}
}
