import React from "react";
import { Link as RouterLink } from "react-router-dom";

// Minimal shim for `next/link` using react-router's Link
// Supports `href` prop and passes through other props.
interface Props extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children?: React.ReactNode;
}

const NextLink: React.FC<Props> = ({ href, children, ...rest }) => {
  return (
    <RouterLink to={href} {...(rest as any)}>
      {children}
    </RouterLink>
  );
};

export default NextLink;
