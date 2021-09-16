import React from 'react';


type AppLinkProps = {
  to: string;
  hashType?: boolean;
  children?: React.ReactNode;
} & React.AnchorHTMLAttributes<any>;

const AppLink: React.FC<AppLinkProps> = (props: AppLinkProps) => {
  const {to, hashType, children, ...rest} = props;
  const linkTo = hashType && to.indexOf('#') === -1 ? `/#${to}` : to;
  return (
    <a
      {...rest}
      href={linkTo}
      onClick={(e) => {
        e.preventDefault();
        window.history.pushState({}, '', linkTo);
      }}
    >
      {children}
    </a>
  );
};

export const appHistory = {
  push: (path: string) => {
    window.history.pushState({}, '', path);
  },
  replace: (path: string) => {
    window.history.replaceState({}, '', path);
  },
};

export default AppLink;
