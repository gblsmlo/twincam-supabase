import type { MemberRepository } from '@/modules/member/repository/member-repository'
import { Role } from '@/modules/member/value-objects/member-role'

export class PermissionChecker {
	constructor(private readonly memberRepository: MemberRepository) {}

	async canInviteMember(
		actorUserId: string,
		spaceId: string,
		targetRole: string,
	): Promise<boolean> {
		const actor = await this.findActorMember(actorUserId, spaceId)
		if (!actor) return false

		const actorRole = Role.fromType(actor.role)
		if (!actorRole.canInvite()) return false

		const target = Role.from(targetRole)
		return actorRole.isHigherOrEqual(target)
	}

	async canRemoveMember(
		actorUserId: string,
		spaceId: string,
		targetMemberId: string,
	): Promise<boolean> {
		const actor = await this.findActorMember(actorUserId, spaceId)
		if (!actor) return false

		const actorRole = Role.fromType(actor.role)
		if (!actorRole.canRemove()) return false

		const target = await this.memberRepository.findById(targetMemberId)
		if (!target) return false

		// Cannot remove yourself
		if (actor._id === target._id) return false

		const targetRole = Role.fromType(target.role)

		// Only owner can remove other owners
		if (targetRole.equals(Role.fromType('owner'))) {
			if (!actorRole.equals(Role.fromType('owner'))) return false

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

		const actorRole = Role.fromType(actor.role)
		const targetRole = Role.fromType(target.role)
		const newMemberRole = Role.from(newRole)

		// Must have higher role than target's current role
		if (!actorRole.isHigherThan(targetRole)) return false

		// Cannot assign a role higher than own
		if (!actorRole.isHigherOrEqual(newMemberRole)) return false

		return true
	}

	async canDeleteOrganization(actorUserId: string, spaceId: string): Promise<boolean> {
		const actor = await this.findActorMember(actorUserId, spaceId)
		if (!actor) return false

		const actorRole = Role.fromType(actor.role)
		return actorRole.canDeleteOrganization()
	}

	async isLastOwner(spaceId: string): Promise<boolean> {
		const members = await this.memberRepository.findBySpaceId(spaceId)
		const ownerRole = Role.fromType('owner')
		const owners = members.filter((m) => Role.fromType(m.role).equals(ownerRole))
		return owners.length <= 1
	}

	private async findActorMember(actorUserId: string, spaceId: string) {
		return this.memberRepository.findByUserIdAndSpaceId(actorUserId, spaceId)
	}
}
