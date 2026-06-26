# Architecture Decision Records

## What is an ADR?

An Architecture Decision Record (ADR) is a short document that captures a significant architectural decision made in the project, including the context, alternatives considered, and the rationale for the chosen approach.

## When to Write an ADR

Write an ADR when you make a decision that:

- Changes the architecture or folder structure
- Introduces a new technology or framework
- Adopts a new pattern (e.g., state management, component patterns)
- Changes how packages interact
- Has significant implications for future development

## Template

```markdown
# NNN: Title of Decision

## Status

[ Proposed | Accepted | Deprecated | Superseded ]

## Context

What is the issue motivating this decision? What forces are at play?

## Decision

What is the change? What are we doing?

## Consequences

Why is this the right choice? What trade-offs exist? What does this enable or prevent?

## Alternatives Considered

- Alternative A: Why it wasn't chosen
- Alternative B: Why it wasn't chosen
```

## File Naming

```
NNN-title-of-decision.md
```

Where `NNN` is a zero-padded sequence number (001, 002, etc.).

## Existing ADRs

_None yet — this is the first ADR._
