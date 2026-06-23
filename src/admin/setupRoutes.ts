/**
 * Maps a Get-started step's `cta_route` (from launch_step_catalog) to the admin
 * screen key it opens. Shared by AdminApp (the full checklist) and SetupCard
 * (the compact dashboard card) so the two never drift apart.
 */
export const SETUP_ROUTES: Record<string, string> = {
  import: "__super_import",
  branding: "__site",
  style: "__website",
  website: "__site",
  teams: "__teams_seasons",
  invite: "__members",
};
