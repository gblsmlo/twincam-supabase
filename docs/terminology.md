# Terminology Glossary

This document maps business concepts to their code identifiers and describes their implementation status.

## Core Terms

| Business Concept | Code Identifier | Table / Type | Status | Notes |
|------------------|-----------------|--------------|--------|-------|
| Organization | `Organization` | `organizationsTable` (DB: `spaces`) | ✅ Implemented | Root unit of multi-tenancy. DB table name is `spaces` (legacy), Drizzle model is `organizationsTable`. |
| Sub-organization | `parentOrganizationId` | `organizationsTable.parent_organization_id` | ✅ Implemented | Managed by `HierarchyService`. |
| Member | `Member` | `membersTable` | ✅ Implemented | Links a `User` to an `Organization` with a `Role`. |
| Role | `memberRoleEnum` | `membersTable.role` | ✅ Implemented | Values: `owner`, `admin`, `member`. PostgreSQL enum `member_role`. |
| Platform Admin | `isPlatformAdmin` | `User.isPlatformAdmin` | ⚠️ Partial | Field exists on `User` type. RLS bypass and cross-org admin UI are planned. |
| Hierarchy Path | `hierarchyPath` | `organizationsTable.hierarchy_path` | ✅ Implemented | Text materialized path (e.g. `UUID1.UUID2`). Not PostgreSQL LTREE. |
| Hierarchy Level | `hierarchyLevel` | `organizationsTable.hierarchy_level` | ✅ Implemented | Integer depth (root = 1). |

## Domain Services

| Service | Location | Status | Responsibility |
|---------|----------|--------|----------------|
| `HierarchyService` | `src/modules/organization/services/hierarchy-service.ts` | ✅ Implemented | Tree validation and movement, path cascade updates. |
| `OnboardingService` | `src/modules/organization/services/onboarding-service.ts` | ✅ Implemented | Creates Organization + initial owner Member. |

## Repository Patterns

| Pattern | Method | Purpose |
|---------|--------|---------|
| Tenant scoping (reads) | `BaseRepository.withOrgFilter()` | Injects `AND organization_id = ?` into every query. |
| Tenant scoping (writes) | `BaseRepository.injectOrgId()` | Injects `organizationId` into insert payloads. |
| Scoped factory | `organizationRepository(orgId)` | Binds org context at construction time. |

## Planned Features

| Concept | Status | Description |
|---------|--------|-------------|
| Recursive RLS | 🔲 Planned | PostgreSQL policies granting parent admins access to child org records. |
| Platform Admin RLS bypass | 🔲 Planned | Privileged DB role for users with `isPlatformAdmin = true`. |
| Custom roles / RBAC | 🔲 Planned | Permission matrices beyond the current 3-role enum. |
