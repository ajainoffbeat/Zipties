import { ReactNode } from "react";
import { AuthSidePanel } from "@/components/AuthSidePanel/AuthSidePanel";
import { Footer } from "@/components/Footer/Footer";

interface AuthLayoutProps {
  children: ReactNode;
  logo: string;
  title: string;
  description: string;
}

export function AuthLayout({
  children,
  logo,
  title,
  description,
}: AuthLayoutProps) {
  return (
    <>
      <div className="min-h-[91vh] bg-background flex">
        <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 p-5">
          <div className="max-w-md w-full mx-auto">{children}</div>
        </div>

        <AuthSidePanel
          logo={logo}
          title={title}
          description={description}
        />
      </div>

      <Footer />
    </>
  );
}