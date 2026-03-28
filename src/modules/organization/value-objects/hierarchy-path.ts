import { ValueError } from '../errors/value-errors'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const PATH_REGEX =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?:\.[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})*$/

export class HierarchyPath {
	private readonly path: string
	private readonly ids: string[]
	private readonly level: number

	private constructor(path: string) {
		this.path = path
		this.ids = path ? path.split('.') : []
		this.level = this.ids.length
	}

	/**
	 * Creates a HierarchyPath from a dot-separated UUID string.
	 * Empty string represents a root organization path.
	 */
	static from(pathString: string): HierarchyPath {
		if (pathString === '') {
			return new HierarchyPath('')
		}

		if (!PATH_REGEX.test(pathString)) {
			throw new ValueError('Formato de hierarchy path inválido.')
		}

		return new HierarchyPath(pathString)
	}

	/**
	 * Creates an empty root path (for root organizations).
	 */
	static root(): HierarchyPath {
		return new HierarchyPath('')
	}

	/**
	 * Extends a parent's path with a child ID, producing the child's hierarchy path.
	 * Example: parent path "a" + child ID "b" → child path "a.b"
	 * Example: root path "" + child ID "a" → child path "a"
	 */
	static extend(parentPath: HierarchyPath, childId: string): HierarchyPath {
		if (!childId || !UUID_REGEX.test(childId)) {
			throw new ValueError('Formato de ID inválido.')
		}

		const newPath = parentPath.path ? `${parentPath.path}.${childId}` : childId

		return new HierarchyPath(newPath)
	}

	/**
	 * Gets the parent path (all IDs except last).
	 * Returns null if this is a root path or single-level path.
	 */
	getParentPath(): HierarchyPath | null {
		if (this.ids.length <= 1) return null
		return new HierarchyPath(this.ids.slice(0, -1).join('.'))
	}

	/**
	 * Gets all ancestor paths (from root through parent, excluding self).
	 */
	getAncestorPaths(): HierarchyPath[] {
		const ancestors: HierarchyPath[] = []
		for (let i = 1; i < this.ids.length; i++) {
			ancestors.push(new HierarchyPath(this.ids.slice(0, i).join('.')))
		}
		return ancestors
	}

	/**
	 * Gets the depth level.
	 * Root path (empty) → 0, single ID → 1, etc.
	 */
	getLevel(): number {
		return this.level
	}

	/**
	 * Gets all IDs in the path (defensive copy).
	 */
	getIds(): string[] {
		return [...this.ids]
	}

	/**
	 * Gets the root ID (first in path).
	 */
	getRootId(): string | null {
		return this.ids[0] ?? null
	}

	/**
	 * Gets the leaf ID (last in path).
	 */
	getLeafId(): string | null {
		return this.ids[this.ids.length - 1] ?? null
	}

	/**
	 * Checks if this path contains a given ID.
	 */
	contains(id: string): boolean {
		return this.ids.includes(id)
	}

	/**
	 * Checks if this path is a descendant of another.
	 */
	isDescendantOf(other: HierarchyPath): boolean {
		if (other.path === '') {
			return this.path !== ''
		}
		return this.path.startsWith(`${other.path}.`)
	}

	/**
	 * Checks if this path is an ancestor of another.
	 */
	isAncestorOf(other: HierarchyPath): boolean {
		return other.isDescendantOf(this)
	}

	/**
	 * Returns true if this is a root path (empty string).
	 */
	isEmpty(): boolean {
		return this.path === ''
	}

	/**
	 * String representation (dot-separated UUIDs).
	 */
	toString(): string {
		return this.path
	}

	/**
	 * Value object equality.
	 */
	equals(other: HierarchyPath): boolean {
		return this.path === other.path
	}
}
