import type { CustomerRepository } from '@/modules/customer/repository/customer-repository'
import type { Customer } from '@/modules/customer/types'
import type { MemberRepository } from '@/modules/member/repository/member-repository'
import type { Member } from '@/modules/member/types'
import type { SubscriptionRepository } from '@/modules/subscription/repository/subscription-repository'
import type { Subscription } from '@/modules/subscription/types'
import { failure, type Result, success } from '@/shared/errors/result'
import type { SpaceRepository } from '../repository/space-repository'
import type { Space } from '../types'

const SLUG_REGEX = /^[a-z0-9-]+$/
const TRIAL_DAYS = 14

export interface OnboardingResult {
	organization: Space
	membership: Member
	customer: Customer | null
	subscription: Subscription | null
}

interface OnboardingRepositories {
	spaceRepository: SpaceRepository
	memberRepository: MemberRepository
	subscriptionRepository: SubscriptionRepository
	customerRepository: CustomerRepository
}

export class OnboardingService {
	constructor(private readonly repos: OnboardingRepositories) {}

	/**
	 * Onboarda um novo usuário criando organização, membership e billing.
	 *
	 * Saga steps:
	 *   1. Valida inputs
	 *   2. Cria Organization (Space)
	 *   3. Cria Membership (OWNER)
	 *   4. Inicializa billing (Customer + Subscription) — non-critical
	 *
	 * Compensação:
	 *   - Step 2 fail → retorna failure (nada criado)
	 *   - Step 3 fail → deleta Organization (rollback step 2)
	 *   - Step 4 fail → log warning, continua (billing é non-critical)
	 */
	async onboardNewUser(
		userId: string,
		organizationName: string,
		organizationSlug: string,
		userEmail: string,
		userName: string,
	): Promise<Result<OnboardingResult>> {
		// Step 1: Validação
		const validationError = this.validateInputs(userId, organizationName, organizationSlug)
		if (validationError) {
			return validationError
		}

		const existingOrg = await this.repos.spaceRepository.findBySlug(organizationSlug)
		if (existingOrg) {
			return failure({
				message: 'Esse slug de organização já está em uso.',
				type: 'VALIDATION_ERROR',
			})
		}

		// Step 2: Cria Organization
		let organization: Space
		try {
			organization = await this.repos.spaceRepository.create({
				name: organizationName,
				ownerId: userId,
				parentOrganizationId: null,
				slug: organizationSlug,
			})
		} catch (error) {
			return failure({
				error: error instanceof Error ? error.message : 'Erro desconhecido',
				message: 'Falha ao criar a organização.',
				type: 'DATABASE_ERROR',
			})
		}

		// Step 3: Cria Membership (OWNER)
		let membership: Member
		try {
			membership = await this.repos.memberRepository.create({
				organizationId: organization._id,
				role: 'owner',
				spaceId: organization._id,
				userId,
			})
		} catch (error) {
			// Compensação: rollback step 2
			await this.rollbackOrganization(organization._id)

			return failure({
				error: error instanceof Error ? error.message : 'Erro desconhecido',
				message: 'Falha ao criar a associação do usuário à organização.',
				type: 'DATABASE_ERROR',
			})
		}

		// Step 4: Inicializa billing (non-critical)
		const billing = await this.initializeBillingPlan(organization._id, userEmail, userName)

		return success(
			{
				customer: billing.customer,
				membership,
				organization,
				subscription: billing.subscription,
			},
			'Usuário integrado com sucesso.',
		)
	}

	private validateInputs(
		userId: string,
		organizationName: string,
		organizationSlug: string,
	): Result<never> | null {
		if (!userId || !organizationName || !organizationSlug) {
			return failure({
				message: 'Campos obrigatórios não preenchidos.',
				type: 'VALIDATION_ERROR',
			})
		}

		if (!SLUG_REGEX.test(organizationSlug)) {
			return failure({
				message: 'Formato de slug inválido. Use apenas letras minúsculas, números e hífens.',
				type: 'VALIDATION_ERROR',
			})
		}

		return null
	}

	private async initializeBillingPlan(
		organizationId: string,
		userEmail: string,
		userName: string,
	): Promise<{
		customer: Customer | null
		subscription: Subscription | null
	}> {
		try {
			const customer = await this.repos.customerRepository.create({
				email: userEmail,
				name: userName,
				organizationId,
				spaceId: organizationId,
			})

			const now = new Date()
			const trialEndsAt = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000)

			const subscription = await this.repos.subscriptionRepository.create({
				customerId: customer._id,
				organizationId,
				planName: 'free_trial',
				startedAt: now,
				status: 'active',
				trialEndsAt,
			})

			return { customer, subscription }
		} catch (error) {
			console.warn(
				'[OnboardingService] Falha ao inicializar billing (non-critical):',
				error instanceof Error ? error.message : error,
			)
			return { customer: null, subscription: null }
		}
	}

	private async rollbackOrganization(organizationId: string): Promise<void> {
		try {
			await this.repos.spaceRepository.delete(organizationId)
		} catch (rollbackError) {
			console.error(
				'[OnboardingService] Falha no rollback da organização:',
				rollbackError instanceof Error ? rollbackError.message : rollbackError,
			)
		}
	}
}
