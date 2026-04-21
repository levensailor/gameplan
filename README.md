# Gameplan

## Description
Gameplan is a modern single-board Kanban planner for engineering and project-delivery teams. It supports Webex login, drag-and-drop card movement across five workflow columns, engineer avatar assignment, and project metadata editing in a modal card editor.

## Author
Levensailor

## Deployment Instructions
1. Install dependencies:
   - `npm install`
2. Set environment values using `.env.example` as a template.
3. Apply SQL scripts manually in order:
   - `sql/001_init_schema.sql`
   - `sql/002_seed_defaults.sql`
   - `sql/003_webex_directory_cache.sql`
   - `sql/004_engineer_profile_fields.sql`
   - `sql/005_user_theme_settings.sql`
4. Build and deploy with Vercel:
   - `vercel`
   - `vercel --prod`

## Public Assets
- App URL: add your production URL after first deployment.
- Webex OAuth callback URL: `https://<your-domain>/oauth`

## Login Instructions
1. Open the deployed app URL.
2. Click **Login with Webex**.
3. Authorize with a Webex user that has `spark:people_read` scope.
4. You will be redirected to the planner board after authentication.
