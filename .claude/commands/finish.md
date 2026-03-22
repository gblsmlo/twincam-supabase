# Finishing a Development Branch

Guide completion of development work by verifying quality, presenting structured options, and executing the chosen workflow.

**Announce at start:** "Running the finish skill to complete this branch."

## Step 1: Verify Quality

Run all checks before presenting options:

```bash
pnpm test
pnpm lint
```

**If either fails:** Report failures and stop. Do not proceed until fixed.

**If both pass:** Continue to Step 2.

## Step 2: Gather Context

```bash
# Current branch
git branch --show-current

# Commits on this branch vs main
git log main..HEAD --oneline

# Full diff stats
git diff main..HEAD --stat

# Check if branch is pushed
git log origin/$(git branch --show-current)..HEAD --oneline 2>/dev/null
```

Determine:
- **Base branch**: `main` (this project always uses `main`)
- **Number of commits** and **files changed**
- **Whether branch needs pushing**

## Step 3: Present Options

Present exactly these 4 options:

```
Implementation complete. All tests pass. What would you like to do?

1. Merge back to main locally
2. Push and create a Pull Request
3. Keep the branch as-is (I'll handle it later)
4. Discard this work

Which option?
```

Wait for user input. Do not proceed without a choice.

## Step 4: Execute Choice

### Option 1: Merge Locally

```bash
git checkout main
git pull origin main
git merge <feature-branch>
pnpm test  # Verify tests on merged result
git branch -d <feature-branch>
```

### Option 2: Push and Create PR

Push the branch if needed:

```bash
git push -u origin <feature-branch>
```

**Build the PR body** by reading the project template and filling every section:

```bash
cat .github/pull_request_template.md
```

Replace all placeholder comments with real content derived from `git log` and `git diff`. Remove optional sections that don't apply (e.g., delete "Breaking Changes" if none). Check the boxes that are true.

Then create the PR:

```bash
gh pr create --title "<type>(<scope>): <subject>" --body "$(cat <<'EOF'
<filled-in template content>
EOF
)"
```

**PR title** rules (Conventional Commits, enforced by commitlint):
- Format: `<type>(<scope>): <subject>`
- Max 70 characters, imperative mood, no period
- Valid types: `feat` `fix` `docs` `style` `refactor` `perf` `test` `build` `ci` `chore` `revert`
- Valid scopes: `setup` `infra` `config` `deps` `ui` `api` `auth` `db` `docs` `test` `build` `ci` `release`

If a PR already exists for this branch, update it instead:

```bash
gh pr edit <number> --title "<title>" --body "<filled-in template content>"
```

### Option 3: Keep As-Is

Report: "Keeping branch `<name>` as-is."

### Option 4: Discard

**Require confirmation first:**
```
This will permanently delete:
- Branch: <name>
- Commits: <list>

Type 'discard' to confirm.
```

Wait for exact confirmation. Then:
```bash
git checkout main
git branch -D <feature-branch>
```

## Commit Conventions

When committing as part of this workflow, always follow these rules:

- **Format**: `<type>(<scope>): <subject>`
- **Subject**: imperative mood, lowercase first letter, no period, max 70 chars
- **Body**: explain what and why, not how
- **Footer**: include `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>` for AI-generated changes
- **Footer**: reference issues with `Closes LINEAR-XXX` or `Refs #NNN`
- Use HEREDOC for commit messages to preserve formatting
- Never use `--no-verify` or skip hooks
- Create NEW commits, never amend existing ones unless explicitly asked

## Rules

- **Never** proceed with failing tests or lint
- **Never** merge without verifying tests on the result
- **Never** delete work without typed confirmation
- **Never** force-push without explicit request
- **Never** commit to `main` directly — create a branch first
- **Always** verify tests before offering options
- **Always** present exactly 4 options
- **Always** use Conventional Commits format for PR titles
- **Always** fill in the PR template completely
