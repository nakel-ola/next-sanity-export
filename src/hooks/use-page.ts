import { usePathname } from "next/navigation";

export const usePage = () => {
  const pathname = usePathname();

  const arr = pathname?.split("/").slice(2);

  return {
    pageType: arr[0] as "structure" | "vision",
    contentName: arr[1],
  };
};
