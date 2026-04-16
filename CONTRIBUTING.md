# Contributing

## Branching Workflow
1. Sync your local main branch.
2. Create a new feature branch:
   - `git checkout -b feature/<short-description>`
3. Make your changes and commit with clear, scoped messages.
4. Push your branch to origin.

## Pull Request Requirements
When creating a pull request, include:
- Why this change should be added to the repository.
- What user/business problem it solves.
- Any migration or environment steps required by reviewers.
- Screenshots or short video for UI changes.

## Quality Checklist
- Keep API payloads validated.
- Avoid hardcoded names in code.
- Update SQL scripts for schema changes (manual apply).
- Add tests where practical and update docs when behavior changes.
