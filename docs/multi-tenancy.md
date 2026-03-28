# Multi-tenancy & Row-Level Security (RLS)

Data isolation is the most critical feature of this skeleton. We use a combination of **application-level filtering** and **PostgreSQL RLS** to ensure tenant data never leaks.

## 1. Isolation Strategy

Every business table must have an `organization_id` column. Tenant isolation is enforced at two layers:

1. **Application layer:** `BaseRepository.withOrgFilter()` injects `AND organization_id = ?` into every read query at construction time.
2. **Database layer (defense-in-depth):** PostgreSQL RLS policies provide a secondary check based on `auth.uid()` and the `members` table.

## 2. Hierarchy & Transparency

### Sub-organizations ✅ Implemented

Organizations can be nested via `parentOrganizationId`. The `HierarchyService` manages tree operations:

- `moveOrganization(orgId, newParentId)` — Moves an org and cascades `hierarchyPath` / `hierarchyLevel` updates to all descendants.
- `getOrganizationTree(rootId)` — Returns the full subtree as a typed `OrganizationNode` tree.
- Hierarchy uses a **text materialized path** (e.g. `UUID1.UUID2.UUID3`) indexed via `idx_spaces_hierarchy_path`.

### Recursive RLS 🔲 Planned

RLS policies that automatically grant parent-org admins access to child-org records are **not yet implemented**. Current RLS policies are flat — scoped to a single `organization_id`.

_Future work: implement recursive RLS policies using `hierarchyPath LIKE 'parent%'` so that a parent org admin can transparently query across all child orgs._

### Platform Admin Bypass 🔲 Planned

The `User` entity has an `isPlatformAdmin: boolean` field that identifies super-admin users. A database connection bypass role (allowing RLS skip for platform admins) is **not yet implemented**.

_Future work: when `isPlatformAdmin = true`, the infrastructure layer switches to a privileged database role that bypasses RLS for cross-organization maintenance._
