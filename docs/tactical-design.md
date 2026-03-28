# Tactical Design

We follow **Model-Driven Design** to ensure business rules are protected and isolated from infrastructure concerns.

## 1. Aggregates

### Organization Aggregate (Root)

`Organization` is the main aggregate root. Almost all data in the system revolves around an organization.

- **Invariants and Rules:**
  - **Hierarchy:** An organization can have a `parentOrganizationId`. The `HierarchyService` prevents an organization from being its own parent or creating cycles.
  - **Identity:** The `slug` must be globally unique to allow friendly URLs (e.g. `app.saas.com/org-name`).
  - **Isolation:** Every entity belonging to this aggregate must carry `organizationId` to comply with the application-level org filter and RLS.

## 2. Entities

### User

The `User` entity represents a physical identity.

- **Business Rule:** A user **must** belong to at least one `Organization`.
- **Platform Admin:** Has the `isPlatformAdmin: boolean` flag on the `User` type. If `true`, this entity gains "Super Admin" powers.
  - _Note: The `isPlatformAdmin` field exists in the domain type. RLS-level admin bypass is **planned**._

### Member

A linking entity that defines the relationship between `User` and `Organization`. Maps to `membersTable`.

- **Attributes:** `userId`, `organizationId`, `role`, `_id`, audit fields.
- **Purpose:** The permissions system decides what the user can do within a specific Organization based on this entity.

## 3. Value Objects

### Role

Represents the access level within an Organization.

- **Values:** `owner` (full control), `admin` (operational management), `member` (limited access).
- **Implementation:** PostgreSQL enum `member_role` on `membersTable.role`.
- **Immutability:** The permissions tied to a Role are fixed for that context.

### HierarchyPath

Supports sub-organization queries efficiently using a **text-based materialized path**.

- **Format:** Dot-separated UUID string. Example: `PARENT_ID.CHILD_ID.GRANDCHILD_ID`.
- **Stored in:** `organizationsTable.hierarchyPath` (text) and `organizationsTable.hierarchyLevel` (integer).
- **Implementation:** Computed and maintained by `HierarchyService.moveOrganization()`. Not PostgreSQL LTREE — plain text with dot separators.
- **Usage:** Allows fetching an entire subtree with a single `LIKE 'path%'` query.

## 4. Domain Services

### HierarchyService

Service responsible for validating and executing movements in the organization tree.

- **`validateMove(orgId, newParentId)`** — Ensures no cycles, no self-parent, parent exists.
- **`moveOrganization(orgId, newParentId)`** — Moves org, recomputes `hierarchyPath` and `hierarchyLevel` in cascade for all descendants.
- **`getOrganizationTree(rootId)`** — Builds the full `OrganizationNode` tree from a root.

### OnboardingService

An application service that coordinates the creation of a new tenant.

- **Flow:** Creates the `Organization` → Creates the creator's `Member` as `owner` → Initializes the billing plan.

## 5. Repositories (Persistence with Drizzle)

Repositories are technology-agnostic interfaces implemented via Drizzle ORM.

- **`BaseRepository`:** Provides two key helpers:
  - `withOrgFilter(column, condition?)` — Wraps any read condition with `AND organization_id = ?`, enforcing tenant isolation at the application layer.
  - `injectOrgId(input)` — Injects `organizationId` into all write payloads.
- **Scoped Factory:** Each repository is created via a factory (e.g. `organizationRepository(orgId)`) that binds the organization context at construction time.
- **RLS as Defense-in-Depth:** PostgreSQL RLS policies provide a secondary isolation layer. The application layer (`withOrgFilter`) is the primary enforcement mechanism.

## 6. Factories

### OrganizationFactory

Encapsulates the complex creation logic for an organization.

- Ensures that when creating an `Organization`, the `hierarchyPath` and `hierarchyLevel` metadata are correctly computed based on the parent.

## 7. Transparency Rules

- **Tenant Context:** The active `organizationId` is captured at the application layer (request/session) and injected into repositories via the factory function.
- **Admin Bypass:** The `isPlatformAdmin` flag exists on `User`. Application-level and RLS-level bypass for platform admins is **planned**.
