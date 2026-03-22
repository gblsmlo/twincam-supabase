# Architectural Documentation

Welcome to the technical documentation for the Skeleton SaaS project. This project is built on the pillars of **Domain-Driven Design (DDD)** and **Feature-Based Architecture (FBA)** to provide an agnostic, scalable, and secure foundation for new products.

## Objective
This skeleton eliminates accidental complexity at the start of new projects by providing a robust foundation for generic subdomains (Auth, Billing, Tenancy), allowing teams to focus exclusively on the **Core Domain**.

## Table of Contents
1. [**Strategic Design**](./strategic-design.md): Context boundaries and Ubiquitous Language.
2. [**Tactical Design**](./tactical-design.md): Entities, Aggregates, and Domain patterns.
3. [**Multi-tenancy & Security (RLS)**](./multi-tenancy.md): Data isolation and account hierarchies.
4. [**Frontend Architecture (FBA)**](./frontend-architecture.md): Feature-based directory structure and governance.

## Tech Stack
- **Framework:** Next.js (App Router)
- **Database & Auth:** Supabase
- **ORM:** Drizzle ORM
- **Linter/Formatter:** Biome
- **Language:** TypeScript
