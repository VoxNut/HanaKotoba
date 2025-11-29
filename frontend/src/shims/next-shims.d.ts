declare module "next-themes" {
  export function useTheme(): { resolvedTheme: string };
  export default any;
}

declare module "next/navigation" {
  export function useRouter(): any;
  export function usePathname(): string;
  export default any;
}

declare module "next/link" {
  const Link: any;
  export default Link;
}
