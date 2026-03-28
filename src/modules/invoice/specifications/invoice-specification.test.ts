import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/infra/db', () => ({
	db: {},
	invoicesTable: {
		_id: 'mock-_id',
		dueDate: 'mock-dueDate',
		organizationId: 'mock-organizationId',
		paidAt: 'mock-paidAt',
		status: 'mock-status',
		subscriptionId: 'mock-subscriptionId',
	},
}))

vi.mock('drizzle-orm', () => ({
	and: vi.fn((...args: unknown[]) => ({ args, type: 'and' })),
	eq: vi.fn((col: unknown, val: unknown) => ({ col, type: 'eq', val })),
	gte: vi.fn((col: unknown, val: unknown) => ({ col, type: 'gte', val })),
	lt: vi.fn((col: unknown, val: unknown) => ({ col, type: 'lt', val })),
	ne: vi.fn((col: unknown, val: unknown) => ({ col, type: 'ne', val })),
	sql: Object.assign(
		vi.fn((...args: unknown[]) => ({ args, type: 'sql' })),
		{
			raw: vi.fn((s: string) => s),
		},
	),
}))

import { invoicesTable } from '@/infra/db'
import { and, eq, gte, lt, ne, sql } from 'drizzle-orm'
import { InvoiceSpecification } from './invoice-specification'

describe('InvoiceSpecification', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	describe('toWhereClause', () => {
		it('should return undefined when no conditions are added', () => {
			const spec = new InvoiceSpecification()
			expect(spec.toWhereClause()).toBeUndefined()
		})

		it('should call and() and return a value when conditions exist', () => {
			const spec = InvoiceSpecification.isOpen()
			const result = spec.toWhereClause()
			expect(and).toHaveBeenCalled()
			expect(result).toBeDefined()
		})
	})

	describe('addCondition', () => {
		it('should be chainable and accumulate multiple conditions', () => {
			const cond1 = { raw: 'cond1', type: 'sql' } as unknown as ReturnType<typeof eq>
			const cond2 = { raw: 'cond2', type: 'sql' } as unknown as ReturnType<typeof eq>
			const spec = new InvoiceSpecification()
			const returned = spec.addCondition(cond1).addCondition(cond2)

			expect(returned).toBe(spec)

			spec.toWhereClause()
			expect(and).toHaveBeenCalledWith(cond1, cond2)
		})
	})

	describe('andSpec', () => {
		it('should be chainable', () => {
			const specA = InvoiceSpecification.isOpen()
			const specB = InvoiceSpecification.isPaid()
			const result = specA.andSpec(specB)
			expect(result).toBe(specA)
		})

		it('should merge conditions from another spec via toWhereClause', () => {
			const specA = InvoiceSpecification.isOpen()
			const specB = InvoiceSpecification.isPaid()
			vi.clearAllMocks()

			specA.andSpec(specB)

			expect(and).toHaveBeenCalled()
		})

		it('should not add condition when other spec is empty', () => {
			const specA = InvoiceSpecification.isOpen()
			const emptySpec = new InvoiceSpecification()
			vi.clearAllMocks()

			specA.andSpec(emptySpec)
			specA.toWhereClause()

			const andCalls = vi.mocked(and).mock.calls
			expect(andCalls.length).toBe(1)
		})
	})

	describe('isOpen', () => {
		it('should call eq with status column and "open"', () => {
			InvoiceSpecification.isOpen()
			expect(eq).toHaveBeenCalledWith(invoicesTable.status, 'open')
		})

		it('should produce a spec with a where clause', () => {
			const spec = InvoiceSpecification.isOpen()
			expect(spec.toWhereClause()).toBeDefined()
		})
	})

	describe('isPaid', () => {
		it('should call eq with status column and "paid"', () => {
			InvoiceSpecification.isPaid()
			expect(eq).toHaveBeenCalledWith(invoicesTable.status, 'paid')
		})
	})

	describe('isOverdue', () => {
		it('should call ne with status column and "paid"', () => {
			InvoiceSpecification.isOverdue()
			expect(ne).toHaveBeenCalledWith(invoicesTable.status, 'paid')
		})

		it('should call lt with dueDate column', () => {
			InvoiceSpecification.isOverdue()
			expect(lt).toHaveBeenCalledWith(invoicesTable.dueDate, expect.anything())
		})

		it('should produce a spec with two conditions', () => {
			const spec = InvoiceSpecification.isOverdue()
			spec.toWhereClause()
			expect(and).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'ne' }),
				expect.objectContaining({ type: 'lt' }),
			)
		})
	})

	describe('isOverdueBy', () => {
		it('should call lt with dueDate column and an interval sql expression', () => {
			InvoiceSpecification.isOverdueBy(30)
			expect(lt).toHaveBeenCalledWith(invoicesTable.dueDate, expect.anything())
		})

		it('should include the days count in the sql expression', () => {
			InvoiceSpecification.isOverdueBy(45)
			expect(vi.mocked(sql).raw).toHaveBeenCalledWith('45')
		})
	})

	describe('isDueWithin', () => {
		it('should call gte with dueDate for lower bound', () => {
			InvoiceSpecification.isDueWithin(7)
			expect(gte).toHaveBeenCalledWith(invoicesTable.dueDate, expect.anything())
		})

		it('should call lt with dueDate for upper bound', () => {
			InvoiceSpecification.isDueWithin(7)
			expect(lt).toHaveBeenCalledWith(invoicesTable.dueDate, expect.anything())
		})

		it('should include the days count in the sql expression', () => {
			InvoiceSpecification.isDueWithin(14)
			expect(vi.mocked(sql).raw).toHaveBeenCalledWith('14')
		})
	})

	describe('isPaidSince', () => {
		it('should call gte with paidAt column and an interval sql expression', () => {
			InvoiceSpecification.isPaidSince(30)
			expect(gte).toHaveBeenCalledWith(invoicesTable.paidAt, expect.anything())
		})

		it('should include the days count in the sql expression', () => {
			InvoiceSpecification.isPaidSince(60)
			expect(vi.mocked(sql).raw).toHaveBeenCalledWith('60')
		})
	})

	describe('findOverdueBy30Days', () => {
		it('should compose isOpen with isOverdueBy(30)', () => {
			InvoiceSpecification.findOverdueBy30Days()
			expect(eq).toHaveBeenCalledWith(invoicesTable.status, 'open')
			expect(lt).toHaveBeenCalledWith(invoicesTable.dueDate, expect.anything())
		})

		it('should produce a defined where clause', () => {
			const spec = InvoiceSpecification.findOverdueBy30Days()
			expect(spec.toWhereClause()).toBeDefined()
		})
	})

	describe('findUpcomingDue7Days', () => {
		it('should compose isOpen with isDueWithin(7)', () => {
			InvoiceSpecification.findUpcomingDue7Days()
			expect(eq).toHaveBeenCalledWith(invoicesTable.status, 'open')
			expect(gte).toHaveBeenCalledWith(invoicesTable.dueDate, expect.anything())
			expect(lt).toHaveBeenCalledWith(invoicesTable.dueDate, expect.anything())
		})

		it('should produce a defined where clause', () => {
			const spec = InvoiceSpecification.findUpcomingDue7Days()
			expect(spec.toWhereClause()).toBeDefined()
		})
	})
})
