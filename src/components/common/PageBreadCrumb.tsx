import React from "react";
import { Link } from "react-router";

type BreadcrumbItem = {
  label: string;
  to?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
};

interface BreadcrumbProps {
  pageTitle: string;
  items?: BreadcrumbItem[]; // OPTIONAL
  separator?: React.ReactNode;
  className?: string;
}

const DefaultSeparator = () => (
  <svg
    className="stroke-current"
    width="17"
    height="16"
    viewBox="0 0 17 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PageBreadcrumb: React.FC<BreadcrumbProps> = ({
  pageTitle,
  items,
  separator = <DefaultSeparator />,
  className,
}) => {
  // 👇 default breadcrumb when none supplied
  const breadcrumbItems: BreadcrumbItem[] =
    items && items.length > 0
      ? items
      : [
          { label: "Home", to: "/" },
          { label: pageTitle },
        ];

  const lastIndex = breadcrumbItems.length - 1;

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 mb-6 ${className ?? ""}`}>
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
        {pageTitle}
      </h2>

      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          {breadcrumbItems.map((item, idx) => {
            const isLast = idx === lastIndex;
            const isLink = !!item.to || !!item.onClick;

            return (
              <li key={`${item.label}-${idx}`} className="flex items-center gap-1.5">
                {isLast || !isLink ? (
                  <span
                    className="text-sm text-gray-800 dark:text-white/90"
                    aria-current={isLast ? "page" : undefined}
                  >
                    {item.label}
                  </span>
                ) : item.to ? (
                  <Link
                    to={item.to}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white/90"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={item.onClick}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white/90"
                  >
                    {item.label}
                  </button>
                )}

                {!isLast && (
                  <span className="text-gray-500 dark:text-gray-400">
                    {item.icon ?? separator}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
};

export default PageBreadcrumb;
