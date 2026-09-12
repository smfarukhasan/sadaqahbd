import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['bn', 'en'],
  defaultLocale: 'bn',
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
