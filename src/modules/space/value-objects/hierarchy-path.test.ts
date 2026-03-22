import { describe, expect, it } from 'vitest'
import { ValueError } from '../errors/value-errors'
import { HierarchyPath } from './hierarchy-path'

const UUID_A = '550e8400-e29b-41d4-a716-446655440001'
const UUID_B = '550e8400-e29b-41d4-a716-446655440002'
const UUID_C = '550e8400-e29b-41d4-a716-446655440003'

describe('HierarchyPath', () => {
	describe('from()', () => {
		it('creates a root path from empty string', () => {
			const path = HierarchyPath.from('')
			expect(path.toString()).toBe('')
			expect(path.isEmpty()).toBe(true)
			expect(path.getLevel()).toBe(0)
		})

		it('creates a path from a single UUID', () => {
			const path = HierarchyPath.from(UUID_A)
			expect(path.toString()).toBe(UUID_A)
			expect(path.getLevel()).toBe(1)
		})

		it('creates a path from dot-separated UUIDs', () => {
			const pathStr = `${UUID_A}.${UUID_B}.${UUID_C}`
			const path = HierarchyPath.from(pathStr)
			expect(path.toString()).toBe(pathStr)
			expect(path.getLevel()).toBe(3)
		})

		it('throws ValueError for invalid format', () => {
			expect(() => HierarchyPath.from('not-a-uuid')).toThrow(ValueError)
			expect(() => HierarchyPath.from('abc.def')).toThrow(ValueError)
			expect(() => HierarchyPath.from(`${UUID_A}..${UUID_B}`)).toThrow(ValueError)
			expect(() => HierarchyPath.from(`.${UUID_A}`)).toThrow(ValueError)
			expect(() => HierarchyPath.from(`${UUID_A}.`)).toThrow(ValueError)
		})
	})

	describe('root()', () => {
		it('creates an empty root path', () => {
			const path = HierarchyPath.root()
			expect(path.toString()).toBe('')
			expect(path.isEmpty()).toBe(true)
			expect(path.getLevel()).toBe(0)
			expect(path.getIds()).toEqual([])
		})
	})

	describe('extend()', () => {
		it('extends a root path with a child ID', () => {
			const root = HierarchyPath.root()
			const child = HierarchyPath.extend(root, UUID_A)
			expect(child.toString()).toBe(UUID_A)
			expect(child.getLevel()).toBe(1)
		})

		it('extends a non-root path with a child ID', () => {
			const parent = HierarchyPath.from(UUID_A)
			const child = HierarchyPath.extend(parent, UUID_B)
			expect(child.toString()).toBe(`${UUID_A}.${UUID_B}`)
			expect(child.getLevel()).toBe(2)
		})

		it('throws ValueError for invalid child ID', () => {
			const parent = HierarchyPath.root()
			expect(() => HierarchyPath.extend(parent, '')).toThrow(ValueError)
			expect(() => HierarchyPath.extend(parent, 'not-a-uuid')).toThrow(ValueError)
		})
	})

	describe('getParentPath()', () => {
		it('returns null for root path', () => {
			expect(HierarchyPath.root().getParentPath()).toBeNull()
		})

		it('returns null for single-level path', () => {
			expect(HierarchyPath.from(UUID_A).getParentPath()).toBeNull()
		})

		it('returns parent path for multi-level path', () => {
			const path = HierarchyPath.from(`${UUID_A}.${UUID_B}.${UUID_C}`)
			const parent = path.getParentPath()
			expect(parent?.toString()).toBe(`${UUID_A}.${UUID_B}`)
		})
	})

	describe('getAncestorPaths()', () => {
		it('returns empty array for root path', () => {
			expect(HierarchyPath.root().getAncestorPaths()).toEqual([])
		})

		it('returns all ancestor paths excluding self', () => {
			const path = HierarchyPath.from(`${UUID_A}.${UUID_B}.${UUID_C}`)
			const ancestors = path.getAncestorPaths()
			expect(ancestors).toHaveLength(2)
			expect(ancestors[0].toString()).toBe(UUID_A)
			expect(ancestors[1].toString()).toBe(`${UUID_A}.${UUID_B}`)
		})

		it('returns empty array for single-level path', () => {
			const path = HierarchyPath.from(UUID_A)
			expect(path.getAncestorPaths()).toEqual([])
		})
	})

	describe('getIds()', () => {
		it('returns empty array for root path', () => {
			expect(HierarchyPath.root().getIds()).toEqual([])
		})

		it('returns a defensive copy', () => {
			const path = HierarchyPath.from(UUID_A)
			const ids = path.getIds()
			ids.push('mutated')
			expect(path.getIds()).toEqual([UUID_A])
		})

		it('returns all IDs in order', () => {
			const path = HierarchyPath.from(`${UUID_A}.${UUID_B}`)
			expect(path.getIds()).toEqual([UUID_A, UUID_B])
		})
	})

	describe('getRootId() / getLeafId()', () => {
		it('returns null for root path', () => {
			const path = HierarchyPath.root()
			expect(path.getRootId()).toBeNull()
			expect(path.getLeafId()).toBeNull()
		})

		it('returns same ID for single-level path', () => {
			const path = HierarchyPath.from(UUID_A)
			expect(path.getRootId()).toBe(UUID_A)
			expect(path.getLeafId()).toBe(UUID_A)
		})

		it('returns correct IDs for multi-level path', () => {
			const path = HierarchyPath.from(`${UUID_A}.${UUID_B}.${UUID_C}`)
			expect(path.getRootId()).toBe(UUID_A)
			expect(path.getLeafId()).toBe(UUID_C)
		})
	})

	describe('contains()', () => {
		it('returns false for root path', () => {
			expect(HierarchyPath.root().contains(UUID_A)).toBe(false)
		})

		it('returns true when ID exists in path', () => {
			const path = HierarchyPath.from(`${UUID_A}.${UUID_B}`)
			expect(path.contains(UUID_A)).toBe(true)
			expect(path.contains(UUID_B)).toBe(true)
		})

		it('returns false when ID does not exist in path', () => {
			const path = HierarchyPath.from(UUID_A)
			expect(path.contains(UUID_C)).toBe(false)
		})
	})

	describe('isDescendantOf() / isAncestorOf()', () => {
		it('root is not descendant of root', () => {
			expect(HierarchyPath.root().isDescendantOf(HierarchyPath.root())).toBe(false)
		})

		it('any non-root path is descendant of root', () => {
			const child = HierarchyPath.from(UUID_A)
			expect(child.isDescendantOf(HierarchyPath.root())).toBe(true)
		})

		it('child is descendant of parent', () => {
			const parent = HierarchyPath.from(UUID_A)
			const child = HierarchyPath.from(`${UUID_A}.${UUID_B}`)
			expect(child.isDescendantOf(parent)).toBe(true)
			expect(parent.isAncestorOf(child)).toBe(true)
		})

		it('parent is not descendant of child', () => {
			const parent = HierarchyPath.from(UUID_A)
			const child = HierarchyPath.from(`${UUID_A}.${UUID_B}`)
			expect(parent.isDescendantOf(child)).toBe(false)
		})

		it('unrelated paths are not related', () => {
			const pathA = HierarchyPath.from(UUID_A)
			const pathB = HierarchyPath.from(UUID_B)
			expect(pathA.isDescendantOf(pathB)).toBe(false)
			expect(pathB.isDescendantOf(pathA)).toBe(false)
		})
	})

	describe('equals()', () => {
		it('two root paths are equal', () => {
			expect(HierarchyPath.root().equals(HierarchyPath.root())).toBe(true)
		})

		it('same paths are equal', () => {
			const path1 = HierarchyPath.from(`${UUID_A}.${UUID_B}`)
			const path2 = HierarchyPath.from(`${UUID_A}.${UUID_B}`)
			expect(path1.equals(path2)).toBe(true)
		})

		it('different paths are not equal', () => {
			const path1 = HierarchyPath.from(UUID_A)
			const path2 = HierarchyPath.from(UUID_B)
			expect(path1.equals(path2)).toBe(false)
		})
	})

	describe('immutability', () => {
		it('has no setters or mutation methods', () => {
			const path = HierarchyPath.from(UUID_A)
			// Verify the object is effectively immutable by checking
			// that operations return new instances
			const extended = HierarchyPath.extend(path, UUID_B)
			expect(path.toString()).toBe(UUID_A)
			expect(extended.toString()).toBe(`${UUID_A}.${UUID_B}`)
		})
	})
})
