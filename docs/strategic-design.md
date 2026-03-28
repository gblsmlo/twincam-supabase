# Strategic Design

To keep the software business-agnostic, we separate responsibilities into **Bounded Contexts** representing generic subdomains.

## 1. Generic Subdomains

- **Identity & Access Management (IAM):** Auth handled via Supabase + permission logic.
- **Organization Management (Tenancy):** Managing organizations, sub-organizations, and memberships.
- **Billing/Subscriptions:** Handling plans and payment gateways.

## 2. Ubiquitous Language

- **Organization:** The root unit of data ownership and multi-tenancy isolation. Maps to `organizationsTable` in code.
- **Member:** The link between a User and an Organization, including a **Role**. Maps to `membersTable` in code.
- **Platform Admin:** A user with global privileges across all organizations. Represented by the `isPlatformAdmin` flag on the `User` entity — not a separate role type.
- **Sub-organization:** An organization linked to a parent organization via `parentOrganizationId` for hierarchical management. Implemented via `HierarchyService`.

> See [terminology.md](./terminology.md) for the full glossary mapping business terms to code identifiers.
