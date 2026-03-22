import type { MemberRepository } from '@/modules/member/repository/member-repository'
import { canModifyRole, isRoleHigherOrEqual } from './role-hierarchy'

export class PermissionChecker {
	constructor(private readonly memberRepository: MemberRepository) {}

	async canInviteMember(
		actorUserId: string,
		spaceId: string,
		targetRole: string,
	): Promise<boolean> {
		const actor = await this.findActorMember(actorUserId, spaceId)
		if (!actor) return false

		if (actor.role !== 'owner' && actor.role !== 'admin') return false

		return isRoleHigherOrEqual(actor.role, targetRole)
	}

	async canRemoveMember(
		actorUserId: string,
		spaceId: string,
		targetMemberId: string,
	): Promise<boolean> {
		const actor = await this.findActorMember(actorUserId, spaceId)
		if (!actor) return false

		if (actor.role !== 'owner') return false

		const target = await this.memberRepository.findById(targetMemberId)
		if (!target) return false

		// Cannot remove yourself
		if (actor._id === target._id) return false

		// Cannot remove last owner
		if (target.role === 'owner') {
			const isLast = await this.isLastOwner(spaceId)
			if (isLast) return false
		}

		return true
	}

	async canUpdateRole(
		actorUserId: string,
		spaceId: string,
		targetMemberId: string,
		newRole: string,
	): Promise<boolean> {
		const actor = await this.findActorMember(actorUserId, spaceId)
		if (!actor) return false

		const target = await this.memberRepository.findById(targetMemberId)
		if (!target) return false

		// Must have higher role than target's current role
		if (!canModifyRole(actor.role, target.role)) return false

		// Cannot assign a role higher than own
		if (!isRoleHigherOrEqual(actor.role, newRole)) return false

		return true
	}

	async canDeleteOrganization(actorUserId: string, spaceId: string): Promise<boolean> {
		const actor = await this.findActorMember(actorUserId, spaceId)
		if (!actor) return false

		return actor.role === 'owner'
	}

	async isLastOwner(spaceId: string): Promise<boolean> {
		const members = await this.memberRepository.findBySpaceId(spaceId)
		const owners = members.filter((m) => m.role === 'owner')
		return owners.length <= 1
	}

	private async findActorMember(actorUserId: string, spaceId: string) {
		return this.memberRepository.findByUserIdAndSpaceId(actorUserId, spaceId)
	}
}
