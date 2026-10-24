# Security Policy

## Reporting a vulnerability

Please **don't open a public issue** for a security problem.

Use GitHub's private reporting instead: open the **Security** tab of this repository and choose
**Report a vulnerability**. Include what you found, how to reproduce it, and what an attacker could
do with it.

This is a personal project maintained by one person, so there's no formal response-time guarantee,
but reports are taken seriously and will be answered as soon as possible.

## Scope

In scope: the application code in this repository, including its database policies
(`supabase/migrations`).

Out of scope: the third-party services it relies on (Supabase, Vercel, OpenRouteService, CARTO).
Please report problems in those to the respective provider.

## Supported versions

Only the latest commit on `main` is supported.

## How access control works

Worth knowing if you're looking for weaknesses: authorization is enforced by Postgres Row Level
Security, not by application code. The details are in the "Security model" section of the
[README](README.md).
