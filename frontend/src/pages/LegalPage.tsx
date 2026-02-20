import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "./Footer";

type Section = {
  email?: string;
  heading: string;
  content?: string;
  list?: string[];
};

type LegalPageProps = {
  title: string;
  lastUpdated: string;
  sections: Section[];
};

export default function LegalPage({
  title,
  lastUpdated,
  sections,
}: LegalPageProps) {
  return (
    <>
      <div className="min-h-screen flex bg-background p-10">
        <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24">
          <div className="max-w-2xl w-full mx-auto">
            <Navbar />
            <h1 className="text-3xl font-bold mb-4 mt-20">{title}</h1>
            <p className="text-muted-foreground mb-8">
              Last updated: {lastUpdated}
            </p>

            <div className="space-y-6 text-sm leading-relaxed">
              {sections.map((section, index) => (
                <section key={index}>
                  <h2 className="font-semibold text-lg mb-2">
                    {section.heading}
                  </h2>

                  {section.content && <p>{section.content}    
                  
                  {section.email && (
                    <a
                      href={`mailto:${section.email}`}
                      className="text-primary underline"
                    >
                      {section.email}
                    </a>
                  )}
                  </p>}

                  {section.list && (
                    <ul className="list-disc pl-6 space-y-1">
                      {section.list.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  )}
                  
                </section>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
