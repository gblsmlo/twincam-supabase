import { failure, type Result, success } from '@/shared/errors/result'
import type { OrganizationRepository } from '../repository/organization-repository'
import type { Organization } from '../types'

export interface OrganizationNode {
	children: OrganizationNode[]
	id: string
	level: number
	name: string
}

export class HierarchyService {
	constructor(private readonly organizationRepository: OrganizationRepository) {}

	/**
	 * Valida uma operação de movimentação na árvore organizacional.
	 * Previne ciclos, self-parent e parent inexistente.
	 */
	async validateMove(orgId: string, newParentId: string | null): Promise<Result<void>> {
		if (orgId === newParentId) {
			return failure({
				message: 'Não é possível mover uma organização para si mesma.',
				type: 'VALIDATION_ERROR',
			})
		}

		if (newParentId === null) {
			return success(undefined)
		}

		const newParent = await this.organizationRepository.findById(newParentId)
		if (!newParent) {
			return failure({
				message: 'Organização pai não encontrada.',
				type: 'NOT_FOUND_ERROR',
			})
		}

		const ancestors = await this.organizationRepository.findAncestors(newParentId)
		const wouldCreateCycle = ancestors.some((ancestor) => ancestor._id === orgId)

		if (wouldCreateCycle) {
			return failure({
				message: 'Não é possível mover a organização para um descendente (criaria um ciclo).',
				type: 'VALIDATION_ERROR',
			})
		}

		return success(undefined)
	}

	/**
	 * Move uma organização para um novo parent e atualiza hierarchy_path em cascata.
	 */
	async moveOrganization(orgId: string, newParentId: string | null): Promise<Result<Organization>> {
		const validation = await this.validateMove(orgId, newParentId)
		if (!validation.success) {
			return validation
		}

		let newLevel = 1
		let newPath = ''

		if (newParentId) {
			const newParent = await this.organizationRepository.findById(newParentId)
			if (newParent) {
				newPath = newParent.hierarchyPath ? `${newParent.hierarchyPath}.${orgId}` : orgId
				newLevel = newParent.hierarchyLevel + 1
			}
		}

		const updated = await this.organizationRepository.update(orgId, {
			hierarchyLevel: newLevel,
			hierarchyPath: newPath,
			parentOrganizationId: newParentId,
		})

		await this.updateDescendantPaths(orgId, newPath, newLevel)

		return success(updated)
	}

	/**
	 * Constrói a árvore organizacional a partir de um nó raiz.
	 */
	async getOrganizationTree(rootId: string): Promise<Result<OrganizationNode>> {
		const root = await this.organizationRepository.findById(rootId)
		if (!root) {
			return failure({
				message: 'Organização não encontrada.',
				type: 'NOT_FOUND_ERROR',
			})
		}

		const node = await this.buildTreeNode(root)
		return success(node)
	}

	private async buildTreeNode(space: Organization): Promise<OrganizationNode> {
		const children = await this.organizationRepository.findByParentId(space._id)
		const childNodes = await Promise.all(children.map((child) => this.buildTreeNode(child)))

		return {
			children: childNodes,
			id: space._id,
			level: space.hierarchyLevel,
			name: space.name,
		}
	}

	private async updateDescendantPaths(
		parentId: string,
		parentPath: string,
		parentLevel: number,
	): Promise<void> {
		const children = await this.organizationRepository.findByParentId(parentId)

		for (const child of children) {
			const childPath = parentPath ? `${parentPath}.${child._id}` : child._id
			const childLevel = parentLevel + 1

			await this.organizationRepository.update(child._id, {
				hierarchyLevel: childLevel,
				hierarchyPath: childPath,
			})

			await this.updateDescendantPaths(child._id, childPath, childLevel)
		}
	}
}
