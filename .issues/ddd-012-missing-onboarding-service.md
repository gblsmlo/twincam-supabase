# DDD-012: Missing OnboardingService

**Severity:** MEDIUM
**Category:** Domain Service | Tactical Design | User Lifecycle
**Status:** Open
**Linear:** [PRD-27](https://linear.app/studio-risine/issue/PRD-27/ddd-012-missing-onboardingservice)
**Depends on:** DDD-009, DDD-015
**Blocks:** User signup and organization creation workflow

## Problem

Tactical design specifies OnboardingService to coordinate initial tenant setup, but **it doesn't exist**.

**Expected Workflow:**
```
OnboardingService.onboardNewUser(user, organizationName):
  1. Create Organization
  2. Create Membership (user as OWNER)
  3. Initialize billing plan
  4. Return created organization
```

**Current State:** No coordinating service; signup logic scattered or missing.

## Recommendation

### Create OnboardingService

```typescript
// NEW: src/modules/space/services/onboarding-service.ts

export class OnboardingService {
  constructor(
    private spaceRepository: ISpaceRepository,
    private memberRepository: IMemberRepository,
    private subscriptionRepository: ISubscriptionRepository,
    private hierarchyService: HierarchyService,
  ) {}

  /**
   * Onboards a new user by creating organization, membership, and billing.
   */
  async onboardNewUser(
    userId: string,
    organizationName: string,
    organizationSlug: string,
  ): Promise<Result<OnboardingResult>> {
    try {
      // Step 1: Validate inputs
      if (!userId || !organizationName || !organizationSlug) {
        return failure(VALIDATION_ERROR, 'Missing required fields');
      }

      if (!/^[a-z0-9-]+$/.test(organizationSlug)) {
        return failure(VALIDATION_ERROR, 'Invalid organization slug format');
      }

      // Check slug uniqueness
      const existingOrg = await this.spaceRepository.findBySlug(organizationSlug);
      if (existingOrg) {
        return failure(VALIDATION_ERROR, 'Organization slug already exists');
      }

      // Step 2: Create Organization
      const organization = await this.spaceRepository.create({
        name: organizationName,
        slug: organizationSlug,
        ownerId: userId,
        organizationId: uuid(), // Root organization
        parentOrganizationId: null, // Root level
        hierarchyPath: '', // Will be set by repository/service
        hierarchyLevel: 1,
      });

      // Step 3: Create Membership (user as OWNER)
      const membership = await this.memberRepository.create({
        userId,
        organizationId: organization.id,
        spaceId: organization.id,
        role: 'OWNER',
      });

      // Step 4: Initialize default billing plan
      const subscription = await this.initializeBillingPlan(
        organization.id,
        userId
      );

      // Step 5: Publish domain event
      // await eventBus.publish(new UserOnboardedEvent(userId, organization.id));

      return success(
        {
          organization,
          membership,
          subscription,
        },
        'User successfully onboarded'
      );
    } catch (error) {
      if (error instanceof DatabaseError) {
        return failure(DATABASE_ERROR, 'Failed to create organization');
      }
      return failure(UNKNOWN_ERROR, 'Onboarding failed');
    }
  }

  /**
   * Initializes default billing plan (e.g., free trial).
   */
  private async initializeBillingPlan(
    organizationId: string,
    userId: string
  ): Promise<Subscription> {
    // Create free trial subscription
    return await this.subscriptionRepository.create({
      organizationId,
      customerId: userId, // Simplified: user is also first customer
      planName: 'free_trial',
      status: 'active',
      startedAt: new Date(),
      trialEndsAt: addDays(new Date(), 14), // 14-day trial
    });
  }

  /**
   * Invites a user to an existing organization.
   */
  async inviteUserToOrganization(
    organizationId: string,
    inviteeEmail: string,
    role: Role,
    inviterUserId: string,
  ): Promise<Result<MemberInvitation>> {
    try {
      // Verify inviter is OWNER of organization
      const inviter = await this.memberRepository.findByUserAndOrganization(
        inviterUserId,
        organizationId
      );

      if (!inviter || inviter.role !== 'OWNER') {
        return failure(
          AUTHORIZATION_ERROR,
          'Only organization owners can invite members'
        );
      }

      // Create invitation
      const invitation = await this.memberRepository.createInvitation({
        organizationId,
        email: inviteeEmail,
        role,
        token: crypto.randomUUID(),
        expiresAt: addDays(new Date(), 7), // 7-day expiry
      });

      // Send invitation email
      // await emailService.sendInvitationEmail(inviteeEmail, invitation.token);

      return success(invitation);
    } catch (error) {
      return failure(DATABASE_ERROR, 'Failed to create invitation');
    }
  }
}

export interface OnboardingResult {
  organization: Space;
  membership: Member;
  subscription: Subscription;
}
```

### Use in Auth Action

```typescript
// src/modules/auth/actions/sign-up-action.ts (UPDATE)

'use server';

export async function signUpAction(input: SignUpInput): Promise<Result<AuthResponse>> {
  try {
    // Step 1: Create Supabase user
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
    });

    if (error || !data.user) {
      return failure(DATABASE_ERROR, 'Failed to create user account');
    }

    // Step 2: Onboard user (create organization, membership, etc.)
    const onboardingService = new OnboardingService(
      spaceRepository(),
      memberRepository(),
      subscriptionRepository(),
      new HierarchyService(spaceRepository()),
    );

    const onboardResult = await onboardingService.onboardNewUser(
      data.user.id,
      input.organizationName,
      input.organizationSlug,
    );

    if (isFailure(onboardResult)) {
      // If onboarding fails, should we delete the auth user?
      // Depends on desired transactionality
      return onboardResult;
    }

    return success({
      user: data.user,
      organization: onboardResult.data.organization,
    });
  } catch (error) {
    return failure(UNKNOWN_ERROR, 'Signup failed');
  }
}
```

## Files to Create

- `/src/modules/space/services/onboarding-service.ts` - Main service
- Update: `/src/modules/auth/actions/sign-up-action.ts` - Use service

## Repository Requirements

Ensure repositories have these methods:
```typescript
// Space repository
findBySlug(slug: string): Promise<Space | null>;

// Member repository
createInvitation(input): Promise<MemberInvitation>;
findByUserAndOrganization(userId, orgId): Promise<Member | null>;
```

## Transaction Safety

**Current Challenge:** If onboarding fails midway, Supabase user exists but organization doesn't.

**Options:**
1. **Accept eventual consistency**: Let user re-signup, cleanup fails
2. **Add rollback**: Delete Supabase user if onboarding fails
3. **Add recovery**: Admin/system can complete pending onboardings

**Recommendation:** Option 1 (simple) initially, migrate to Option 2 when transaction support is added.

## Verification

After implementation:
1. ✅ New users can sign up and auto-create organization
2. ✅ Organization automatically becomes root (parent = null)
3. ✅ User automatically becomes OWNER
4. ✅ Default billing plan created (free trial)
5. ✅ Only OWNER can invite members
6. ✅ Invitations expire after 7 days
7. ✅ Email invitations sent (when email service added)

## Effort Estimate

- Service implementation: 8 hours
- Auth action integration: 4 hours
- Email service hooks: 2 hours
- Tests: 6 hours
- **Total: ~20 hours**

## Related Issues

- DDD-009: Missing organization_id (foundation)
- DDD-015: Missing User entity (prerequisite)
- DDD-004: Missing domain events (service should publish events)
- DDD-007: Member implementation (extends member creation)

---

## System Prompt RISE + Execução por Skill

### RISE Context

- **Role:** Você é um DDD Application Service designer & saga coordinator. Você orquestra fluxos multi-step que cruzam aggregates (User, Organization, Membership, Billing) com compensação em caso de falha.
- **Instructions:** Crie o OnboardingService que coordena a criação completa de um novo tenant: User → Organization → Membership(OWNER) → Billing(free trial). Projete compensação para falhas parciais.
- **Steps:** 1) Criar `src/modules/space/services/onboarding-service.ts` com DI de 4 repositories. 2) Implementar onboardNewUser (4-step saga). 3) Implementar inviteUserToOrganization. 4) Projetar estratégia de compensação. 5) Integrar com sign-up-action existente.
- **Expectation:** Signup completo cria User+Org+Member+Billing em sequência. Falha parcial não deixa estado inconsistente. Retorna Result<OnboardingResult>. Integrado com sign-up-action.

### Execução

**Skill 1 de 2 — Service**
```
/antigravity-awesome-skills:ddd-tactical-patterns
Role: DDD practitioner criando Application Service para onboarding de novos tenants (docs/tactical-design.md §4).
Instructions: Implemente o OnboardingService com orquestração multi-aggregate.
Steps: 1) Crie src/modules/space/services/onboarding-service.ts. Constructor recebe: ISpaceRepository, IMemberRepository, ISubscriptionRepository, OrganizationFactory (DDD-013). 2) onboardNewUser(userId, orgName, orgSlug): a) Valida inputs (name, slug format). b) Usa OrganizationFactory.createOrganizationWithValidation para criar input validado. c) Cria Organization via spaceRepository.create(). d) Cria Membership(OWNER) via memberRepository.create({ userId, organizationId: org.id, role: 'OWNER' }). e) Cria Subscription(free_trial, 14 dias) via subscriptionRepository.create(). f) Retorna success({ organization, membership, subscription }). 3) inviteUserToOrganization(orgId, email, role, inviterUserId): verifica inviter é OWNER, cria invitation com token+expiry. 4) Retorna Result<OnboardingResult> usando src/shared/errors/result.ts.
Expectation: OnboardingService funcional com 2 métodos. DI completa. Result pattern. Mensagens de erro em português.
Referência: .issues/ddd-012-missing-onboarding-service.md. docs/action-implementation-standard.md.
```

**Skill 2 de 2 — Compensação**
```
/antigravity-awesome-skills:saga-orchestration
Role: Saga designer projetando compensação para onboarding multi-step em monolito (não microserviço).
Instructions: Projete a estratégia de rollback/compensação para OnboardingService.onboardNewUser.
Steps: 1) Mapeie os 4 steps como saga: Step1=CreateOrganization, Step2=CreateMembership, Step3=CreateSubscription, Step4=IntegrateAuth. 2) Para cada step, defina compensação: Step1 fail → retorna failure (nada criado). Step2 fail → delete Organization (rollback Step1). Step3 fail → log warning, NÃO rollback (billing é non-critical, pode ser criado depois). Step4 (auth integration) fail → log, continue (User auth já existe). 3) Implemente como try/catch sequencial com cleanup, NÃO como event-driven saga (monolito). 4) Adicione logs estruturados para cada step (success/fail). 5) Use Result<T> pattern para retorno (não throw).
Expectation: Compensação implementada inline no OnboardingService. Nenhum estado inconsistente possível. Logs para debugging. Pattern simples (try/catch + cleanup), não over-engineered.
```
