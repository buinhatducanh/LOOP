-- Migration: 20260323_add_project_management_v2
-- Project Management v2 — Full LOOP 8-Slide process
-- Pushed directly via `prisma db push` due to shadow DB inconsistency.
-- This file is for migration history tracking only.
-- Models added: SalesLead, Quote, Epic, DailyStandup, SlaRule, Deployment, SocialPost, HandoverPackage, MaintenanceContract, EnvFileHistory
-- Extended: Order, Task (with epicId, sla fields), Backlog (with epicId)

-- No-op for shadow DB — all changes pushed directly to production via db push
-- Tables and columns were added synchronously to the real database
