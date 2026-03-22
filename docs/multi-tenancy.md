# Multi-tenancy & Row-Level Security (RLS)

Data isolation is the most critical feature of this skeleton. We use **PostgreSQL RLS** to ensure tenant data never leaks.

## 1. Isolation Strategy
Every business table must have an `organization_id` column. RLS policies filter data automatically based on the `auth.uid()` and the `members` table.

## 2. Hierarchy & Transparency
- **Sub-accounts:** Implemented via `parent_organization_id`.
- **Recursive RLS:** Policies are configured so that an Admin of a "Parent" account can automatically view records of "Child" accounts.
- **Platform Admin:** A bypass exists for users with the `is_platform_admin` flag for support and maintenance.
