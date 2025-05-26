import React from "react";
import Image from "next/image";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen">
      <section className="hidden w-1/2 items-center justify-center bg-brand lg:flex p-10 xl:w-2/5">
        <div className="flex max-h-[800px] max-w-[430px] flex-col justify-center space-y-12">
          <Image
            src="/assets/icons/logo-full.svg"
            alt="logo"
            height={224}
            width={224}
            className="h-auto"
          />
          <div className="space-y-5 text-white">
            <h1 className="h1">Manage Your files the best way</h1>
            <p className="body-1">
              This is a place where you can store all your documents
            </p>
          </div>
          <Image
            src="/assets/images/files.png"
            alt="Files"
            width={290}
            height={290}
            className="transition-all hover:rotate-2 hover:scale-105"
          />
        </div>
      </section>
      <section className="flex flex-1 flex-col items-center bg-white p-4 py-10 lg:justify-center lg:py-0">
        <div className="mb-10 lg:hidden">
          <Image
            alt="logo"
            src="/assets/icons/logo-full-brand.svg"
            width={224}
            height={82}
            className="h-auto w-[200px] lg:[250px]"
          />
        </div>
        {children}
      </section>
    </div>
  );
};

export default Layout;
