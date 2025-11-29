import React from "react";

// Minimal shim for `next/dynamic` to emulate dynamic imports using React.lazy
export default function dynamic(
  importer: () => Promise<{ default: React.ComponentType<any> }>,
  opts?: any
) {
  const Lazy = React.lazy(importer as any);
  return (props: any) => {
    const fallback = opts && opts.loading ? opts.loading() : null;
    return React.createElement(
      React.Suspense,
      { fallback },
      React.createElement(Lazy, props)
    );
  };
}
