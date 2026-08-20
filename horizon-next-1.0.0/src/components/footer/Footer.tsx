const Footer = () => {
  return (
    <div className="flex w-full flex-col items-center justify-between px-1 pb-8 pt-3 lg:px-8 xl:flex-row">
      <p className="mb-4 text-center text-xs font-medium text-gray-500 sm:!mb-0 md:text-sm dark:text-gray-400">
        © 2026 Thakur College of Engineering & Technology (TCET). Central Attendance System.
      </p>
      <div>
        <ul className="flex flex-wrap items-center gap-3 sm:flex-nowrap md:gap-6 text-xs text-gray-500 dark:text-gray-400 font-semibold">
          <li>
            <span className="text-brand-500 dark:text-brand-400">⚡ Superadmin Console</span>
          </li>
          <li>
            <span>ISO 9001:2015 Certified</span>
          </li>
          <li>
            <span>256-Bit SSL Encrypted</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Footer;
