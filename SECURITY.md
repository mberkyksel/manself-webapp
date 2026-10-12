# Security policy

manself is a portfolio project, so security fixes are made on a best-effort basis, but reports are welcome and taken seriously.

## Reporting a vulnerability

Please **don't open a public issue** for a security problem. Report it privately instead:

1. Go to the [Security tab](https://github.com/mberkyksel/manself-webapp/security) of this repository.
2. Choose **Report a vulnerability** and describe what you found: what is affected, how to reproduce it, and what you think the impact is.

You'll get a reply as soon as I can manage, and I'll credit you in the fix if you'd like.

## Scope and expectations

- Only the latest code on the `main` branch is maintained.
- The **demo account** (`demo@manself.local`) is shared on purpose, its credentials are published in the README, and it is reset on every demo login. Anything you do to it is expected and not a vulnerability.
- The default Docker setup (`docker compose up`) is a **demo setup**: demo mode is on and a throwaway secret is generated on each start. For a real deployment, set `DEMO_MODE=false` and your own `JWT_SECRET` (see the README).
- Findings in third-party dependencies that only affect build or dev tooling are tracked through Dependabot.
