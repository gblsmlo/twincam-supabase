import { failure, type Result, success } from '@/shared/errors/result'
import { PermissionChecker } from '@/shared/permissions'
import type { MemberInvitationRepository } from '../repository/member-invitation-repository'
import type { MemberRepository } from '../repository/member-repository'
import type { Member, MemberInvitation, MemberRole } from '../types'

const INVITATION_EXPIRY_DAYS = 7

type InviteParams = {
	actorUserId: string
	email: string
	role: MemberRole
	spaceId: string
}

type AcceptParams = {
	invitationId: string
	userId: string
}

export class MemberInvitationService {
	private readonly permissionChecker: PermissionChecker

	constructor(
		private readonly memberRepository: MemberRepository,
		private readonly invitationRepository: MemberInvitationRepository,
	) {
		this.permissionChecker = new PermissionChecker(memberRepository)
	}

	async invite({
		actorUserId,
		spaceId,
		email,
		role,
	}: InviteParams): Promise<Result<MemberInvitation>> {
		if (!email || !email.includes('@')) {
			return failure({
				message: 'E-mail inválido.',
				type: 'VALIDATION_ERROR',
			})
		}

		const canInvite = await this.permissionChecker.canInviteMember(actorUserId, spaceId, role)
		if (!canInvite) {
			return failure({
				message: 'Você não tem permissão para convidar membros com esse papel.',
				type: 'AUTHORIZATION_ERROR',
			})
		}

		const existing = await this.invitationRepository.findBySpaceIdAndEmail(spaceId, email)
		if (existing) {
			return failure({
				message: 'Já existe um convite pendente para este e-mail neste espaço.',
				type: 'VALIDATION_ERROR',
			})
		}

		try {
			const expiresAt = new Date()
			expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS)

			const invitation = await this.invitationRepository.create({
				email,
				expiresAt,
				role,
				spaceId,
				token: crypto.randomUUID(),
			})

			return success(invitation)
		} catch (error) {
			return failure({
				error: error instanceof Error ? error.message : 'Erro desconhecido',
				message: 'Não foi possível criar o convite.',
				type: 'DATABASE_ERROR',
			})
		}
	}

	async accept({ invitationId, userId }: AcceptParams): Promise<Result<Member>> {
		const invitation = await this.invitationRepository.findById(invitationId)
		if (!invitation) {
			return failure({
				message: 'Convite não encontrado.',
				type: 'NOT_FOUND_ERROR',
			})
		}

		if (invitation.acceptedAt) {
			return failure({
				message: 'Este convite já foi aceito.',
				type: 'VALIDATION_ERROR',
			})
		}

		if (new Date() > invitation.expiresAt) {
			return failure({
				message: 'Este convite expirou.',
				type: 'VALIDATION_ERROR',
			})
		}

		const existingMember = await this.memberRepository.findByUserIdAndSpaceId(
			userId,
			invitation.spaceId,
		)
		if (existingMember) {
			return failure({
				message: 'Você já é membro deste espaço.',
				type: 'VALIDATION_ERROR',
			})
		}

		try {
			const member = await this.memberRepository.create({
				role: invitation.role as MemberRole,
				spaceId: invitation.spaceId,
				userId,
			})

			await this.invitationRepository.update(invitationId, {
				acceptedAt: new Date(),
			})

			return success(member)
		} catch (error) {
			return failure({
				error: error instanceof Error ? error.message : 'Erro desconhecido',
				message: 'Não foi possível aceitar o convite.',
				type: 'DATABASE_ERROR',
			})
		}
	}

	async reject(invitationId: string): Promise<Result<{ deletedId: string }>> {
		const invitation = await this.invitationRepository.findById(invitationId)
		if (!invitation) {
			return failure({
				message: 'Convite não encontrado.',
				type: 'NOT_FOUND_ERROR',
			})
		}

		try {
			const result = await this.invitationRepository.delete(invitationId)
			return success(result)
		} catch (error) {
			return failure({
				error: error instanceof Error ? error.message : 'Erro desconhecido',
				message: 'Não foi possível rejeitar o convite.',
				type: 'DATABASE_ERROR',
			})
		}
	}
}
