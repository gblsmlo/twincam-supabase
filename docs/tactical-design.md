# Tactical Design

We follow **Model-Driven Design** to ensure business rules are protected and isolated from infrastructure concerns.

## 1. Aggregates

### Organization Aggregate (Root)
`Organization` is the main aggregate root. Almost all data in the system revolves around an organization.

- **Invariants and Rules:**
  - **Hierarchy:** An organization can have a `parent_organization_id`. The system must prevent an organization from being its own parent or creating cycles.
  - **Identity:** The `slug` must be globally unique to allow friendly URLs (e.g. `app.saas.com/org-name`).
  - **Isolation:** Every entity belonging to this aggregate must carry the `organization_id` to comply with RLS.

## 2. Entities

### User
The `User` entity represents a physical identity.
- **Business Rule:** A user **must** belong to at least one `Organization`.
- **Platform Admin:** Has the `is_platform_admin` flag. If `true`, this entity gains "Super Admin" powers, allowing access to any organization through the infrastructure layer (RLS bypass).

### Membership
A linking entity that defines the relationship between `User` and `Organization`.
- **Attributes:** `userId`, `organizationId`, `roleId`, `joinedAt`.
- **Purpose:** It is through this entity that the permissions system decides what the user can do within a specific Tenant.

## 3. Value Objects

### Role
Represents the access level.
- **Types:** `OWNER` (Full control), `ADMIN` (Operational management), `MEMBER` (Limited access).
- **Immutability:** The permissions tied to a Role are fixed or managed as an immutable set for that context.

### HierarchyPath
To support sub-accounts efficiently:
- We use the concept of **Materialized Path** (or LTREE in PostgreSQL).
- **Example:** A level-3 sub-account would have a path like `PARENT_ID.CHILD_ID.GRANDCHILD_ID`. This allows fetching the entire tree at once.

## 4. Domain Services

### HierarchyService
Service responsible for validating movements in the organization tree.
- **Method:** `validateMove(orgId, newParentId)`. Ensures that the hierarchical structure remains intact.

### OnboardingService
An application service that coordinates the creation of a new Tenant.
- **Flow:** Creates the `Organization` -> Creates the creator's `Membership` as `OWNER` -> Initializes the billing plan.

## 5. Repositories (Persistence with Drizzle)

Repositories in the skeleton are technology-agnostic but implemented via Drizzle.

- **BaseRepository:** Defines the default behavior for injecting `organizationId` into all write operations.
- **RLS Transparency:** The repository does not need to inject `WHERE organization_id = ...` into each read query, as PostgreSQL/Supabase handles this automatically. The repository simply exposes the query methods.

## 6. Factories

### OrganizationFactory
Encapsulates the complex creation of an organization.
- Ensures that when creating an `Organization`, the hierarchy metadata (Path) is correctly computed based on the parent account.

## 7. Transparency Rules
- **Tenant Context:** The active `organization_id` is captured at the application layer (Request/Session) and passed down to the infrastructure layer.
- **Admin Bypass:** The infrastructure code checks whether the logged-in user has the `is_platform_admin` flag. If so, the database connection may assume a bypass role to allow global management.
