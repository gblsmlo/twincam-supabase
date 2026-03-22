import { failure, type Result, success } from '@/shared/errors/result'
import { PermissionChecker } from '@/shared/permissions'
import type { MemberRepository } from '../repository/member-repository'
import type { Member, MemberRole } from '../types'

export class MemberRoleService {
	private readonly permissionChecker: PermissionChecker

	constructor(private readonly memberRepository: MemberRepository) {
		this.permissionChecker = new PermissionChecker(memberRepository)
	}

	async addMember(
		actorUserId: string,
		spaceId: string,
		targetUserId: string,
		role: MemberRole,
	): Promise<Result<Member>> {
		const canInvite = await this.permissionChecker.canInviteMember(actorUserId, spaceId, role)
		if (!canInvite) {
			return failure({
				message: 'Você não tem permissão para adicionar membros com esse papel.',
				type: 'AUTHORIZATION_ERROR',
			})
		}

		// Check if user is already a member
		const existing = await this.memberRepository.findByUserIdAndSpaceId(targetUserId, spaceId)
		if (existing) {
			return failure({
				message: 'Esse usuário já é membro deste espaço.',
				type: 'VALIDATION_ERROR',
			})
		}

		try {
			const member = await this.memberRepository.create({
				role,
				spaceId,
				userId: targetUserId,
			})
			return success(member)
		} catch (error) {
			return failure({
				error: error instanceof Error ? error.message : 'Erro desconhecido',
				message: 'Não foi possível adicionar o membro.',
				type: 'DATABASE_ERROR',
			})
		}
	}

	async updateRole(
		actorUserId: string,
		spaceId: string,
		targetMemberId: string,
		newRole: MemberRole,
	): Promise<Result<Member>> {
		const canUpdate = await this.permissionChecker.canUpdateRole(
			actorUserId,
			spaceId,
			targetMemberId,
			newRole,
		)
		if (!canUpdate) {
			return failure({
				message: 'Você não tem permissão para alterar o papel deste membro.',
				type: 'AUTHORIZATION_ERROR',
			})
		}

		try {
			const updated = await this.memberRepository.update(targetMemberId, { role: newRole })
			return success(updated)
		} catch (error) {
			return failure({
				error: error instanceof Error ? error.message : 'Erro desconhecido',
				message: 'Não foi possível atualizar o papel do membro.',
				type: 'DATABASE_ERROR',
			})
		}
	}

	async removeMember(
		actorUserId: string,
		spaceId: string,
		targetMemberId: string,
	): Promise<Result<{ deletedId: string }>> {
		const canRemove = await this.permissionChecker.canRemoveMember(
			actorUserId,
			spaceId,
			targetMemberId,
		)
		if (!canRemove) {
			return failure({
				message: 'Você não tem permissão para remover este membro.',
				type: 'AUTHORIZATION_ERROR',
			})
		}

		try {
			const result = await this.memberRepository.deleteIfNotLastOwner(targetMemberId, spaceId)
			if (!result) {
				return failure({
					message: 'Não é possível remover o último proprietário do espaço.',
					type: 'VALIDATION_ERROR',
				})
			}
			return success(result)
		} catch (error) {
			return failure({
				error: error instanceof Error ? error.message : 'Erro desconhecido',
				message: 'Não foi possível remover o membro.',
				type: 'DATABASE_ERROR',
			})
		}
	}

	async transferOwnership(
		actorUserId: string,
		spaceId: string,
		newOwnerMemberId: string,
	): Promise<Result<{ newOwner: Member; previousOwner: Member }>> {
		const actor = await this.memberRepository.findByUserIdAndSpaceId(actorUserId, spaceId)
		if (!actor || actor.role !== 'owner') {
			return failure({
				message: 'Apenas o proprietário pode transferir a propriedade.',
				type: 'AUTHORIZATION_ERROR',
			})
		}

		const newOwner = await this.memberRepository.findById(newOwnerMemberId)
		if (!newOwner) {
			return failure({
				message: 'Membro não encontrado.',
				type: 'NOT_FOUND_ERROR',
			})
		}

		if (actor._id === newOwner._id) {
			return failure({
				message: 'Você já é o proprietário deste espaço.',
				type: 'VALIDATION_ERROR',
			})
		}

		try {
			const updatedNewOwner = await this.memberRepository.update(newOwnerMemberId, {
				role: 'owner',
			})
			const updatedPreviousOwner = await this.memberRepository.update(actor._id, {
				role: 'admin',
			})

			return success({
				newOwner: updatedNewOwner,
				previousOwner: updatedPreviousOwner,
			})
		} catch (error) {
			return failure({
				error: error instanceof Error ? error.message : 'Erro desconhecido',
				message: 'Não foi possível transferir a propriedade.',
				type: 'DATABASE_ERROR',
			})
		}
	}
}
