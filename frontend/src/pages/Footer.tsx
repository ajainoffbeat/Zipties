import { Link } from "react-router-dom";

const footerLinks = [
  { label: "Terms and Conditions ", to: "/terms" },
  { label: "Privacy Policy", to: "/privacy-policy" },
  { label: "About Us", to: "/about-us" },
  // { label: "Cookie Policy", to: "/cookie-policy" },
  // { label: "Copyright Policy", to: "/copyright" },
//   { label: "Send Feedback", to: "/feedback" },
];

export const Footer = () => {
  return (
    <footer className="w-full border-t border-border bg-background ">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex flex-col gap-3 text-center md:flex-row md:items-center md:justify-between">
          
          {/* Left */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Zipties</span>
            <span>© {new Date().getFullYear()}</span>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
};
