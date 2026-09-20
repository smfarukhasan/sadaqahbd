/**
 * Helper to identify whether a given pathname belongs to a dedicated
 * User Dashboard / Control Panel workspace (Student, Teacher, Org, Donor, Admin, MasterAdmin).
 *
 * When on a panel route, the public website chrome (Navbar, Footer, AppHeader, BottomNav)
 * must NOT render, keeping the workspace completely separated from the public home screen.
 */
export function isPanelRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  // Strip locale prefix if present (e.g. /bn/student -> /student, /en/admin -> /admin)
  const clean = pathname.replace(/^\/(bn|en)(\/|$)/, '/');

  return (
    clean.startsWith('/admin') ||
    clean.startsWith('/student') ||
    clean.startsWith('/teacher') ||
    clean.startsWith('/organization') ||
    clean.startsWith('/donor') ||
    clean.startsWith('/masteradmin')
  );
}
