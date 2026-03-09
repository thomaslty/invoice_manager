---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git commit:*)
description: Create a git commit without Co-Authored-By lines
---

## Context

- Current git status: !`git status`
- Current git diff (staged and unstaged changes): !`git diff HEAD`
- Current branch: !`git branch --show-current`
- Recent commits: !`git log --oneline -5`

## Your task

Based on the above changes, create a single git commit.

## Rules

- NEVER add `Co-Authored-By` lines to commit messages
- NEVER add any trailer or sign-off lines
- Write a concise commit message that focuses on the "why" not the "what"
- Use conventional commit format: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, etc.
- Stage only relevant files (avoid `.env`, credentials, or large binaries)

## Execution

Stage and create the commit using a single message. Do not use any other tools or do anything else. Do not send any other text or messages besides the tool calls.
