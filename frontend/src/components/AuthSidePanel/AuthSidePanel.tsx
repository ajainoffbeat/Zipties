interface AuthSidePanelProps {
  logo: string
  title: string
  description: string
}

export const AuthSidePanel = ({
  logo,
  title,
  description
}: AuthSidePanelProps) => {
  return (
    <div className="hidden lg:flex flex-1 bg-gradient-hero items-center justify-center p-16 relative overflow-hidden">

      {/* Background Blur Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-primary-foreground/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-primary-foreground/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative text-center text-primary-foreground max-w-lg">
        <div className="w-20 h-20 rounded-2xl bg-primary-foreground/20 flex items-center justify-center mx-auto mb-8 animate-float">
          <img src={logo} className="w-16 h-16" alt="logo" />
        </div>

        <h2 className="text-4xl font-bold mb-4">
          {title}
        </h2>

        <p className="text-lg text-primary-foreground/80">
          {description}
        </p>
      </div>
    </div>
  )
}