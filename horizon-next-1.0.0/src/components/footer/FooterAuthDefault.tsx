export default function Footer() {
  return (
    <div className="z-[5] mx-auto flex w-full max-w-screen-sm flex-col items-center justify-between px-[20px] pb-4 lg:mb-6 lg:max-w-[100%] lg:flex-row xl:mb-2 xl:w-[1310px] xl:pb-6">
      <p className="mb-6 text-center text-xs text-gray-500 md:text-sm lg:mb-0 dark:text-gray-400">
        © 2026 Thakur College of Engineering & Technology. Central Attendance Management System.
      </p>
      <ul className="flex flex-wrap items-center gap-6 text-xs text-gray-500 font-semibold dark:text-gray-400">
        <li>
          <span className="text-brand-500 dark:text-brand-400">Official Institutional Portal</span>
        </li>
        <li>
          <span>256-Bit Encrypted</span>
        </li>
      </ul>
    </div>
  );
}
