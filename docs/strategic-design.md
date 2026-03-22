# Strategic Design

To keep the software business-agnostic, we separate responsibilities into **Bounded Contexts** representing generic subdomains.

## 1. Generic Subdomains
- **Identity & Access Management (IAM):** Auth handled via Supabase + permission logic.
- **Organization Management (Tenancy):** Managing accounts, sub-accounts, and memberships.
- **Billing/Subscriptions:** Handling plans and payment gateways.

## 2. Ubiquitous Language
- **Tenant/Organization:** The root unit of data ownership.
- **Membership:** The link between a User and an Organization, including a **Role**.
- **Platform Admin (Super Admin):** A user with global privileges across all tenants.
- **Sub-account:** An organization linked to a parent organization for hierarchical management.
