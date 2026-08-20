/* eslint-disable */
import React from 'react';
import { useCallback } from 'react';
import { usePathname } from 'next/navigation';
import NavLink from 'components/link/NavLink';
import DashIcon from 'components/icons/DashIcon';
import { IRoute } from 'types/navigation';

export const SidebarLinks = (props: { routes: IRoute[] }): JSX.Element => {
  const pathname = usePathname();
  const { routes } = props;

  const activeRoute = useCallback(
    (routePath: string, layout: string) => {
      const fullPath = layout + '/' + routePath;
      return pathname === fullPath || pathname?.startsWith(fullPath);
    },
    [pathname],
  );

  const createLinks = (routes: IRoute[]) => {
    return routes.map((route, index) => {
      const isActive = activeRoute(route.path, route.layout);
      return (
        <NavLink key={index} href={route.layout + '/' + route.path}>
          <div className="relative mb-3 flex hover:cursor-pointer">
            <li
              className="my-[3px] flex cursor-pointer items-center px-8"
              key={index}
            >
              <span
                className={`${
                  isActive
                    ? 'font-bold text-brand-500 dark:text-white'
                    : 'font-medium text-gray-600'
                }`}
              >
                {route.icon ? route.icon : <DashIcon />}{' '}
              </span>
              <p
                className={`leading-1 ml-4 flex ${
                  isActive
                    ? 'font-bold text-navy-700 dark:text-white'
                    : 'font-medium text-gray-600'
                }`}
              >
                {route.name}
              </p>
            </li>
            {isActive ? (
              <div className="absolute right-0 top-px h-9 w-1 rounded-lg bg-brand-500 dark:bg-brand-400" />
            ) : null}
          </div>
        </NavLink>
      );
    });
  };

  return <>{createLinks(routes)}</>;
};

export default SidebarLinks;
