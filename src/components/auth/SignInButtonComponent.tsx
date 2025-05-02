import { SignInButton } from "@clerk/nextjs";
import { TextTypingEffectAnimation } from "@/animations/TextTypingEffectAnimation";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

interface SignInButtonProps {
  text?: string;
  animationSpeed?: number;
  useTypingEffect?: boolean;
  variant?: "terminal" | "plain";
}

export const SignInButtonComponent = ({
  text = "sudo --authenticate user",
  animationSpeed = 120,
  useTypingEffect = true,
  variant = "terminal",
}: SignInButtonProps) => {
  return (
    <SignInButton
      mode="modal"
      appearance={{
        elements: {
          card: "shadow-lg bg-card/95 border-1 border-primary mt-30 rounded-lg",
          headerTitle: "text-foreground",
          headerSubtitle: "text-muted-foreground",
          socialButtonsBlockButton:
            "bg-primary hover:bg-secondary/90 text-secondary-foreground",
          formButtonPrimary:
            "bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-none",
          formButtonReset: "text-muted-foreground hover:text-foreground",
          formFieldLabel: "text-foreground",
          formFieldInput:
            "bg-background border-border focus:border-primary text-foreground placeholder:text-muted-foreground",
          dividerLine: "bg-border",
          dividerText: "text-muted-foreground",
          logoBox: "flex items-center justify-center mb-4 mt-4",
          logoImage: "w-20 h-20 object-contain",
          organizationSwitcherTrigger:
            "bg-background border-border hover:bg-muted",
        },
        layout: {
          showOptionalFields: true,
          logoPlacement: "inside",
          logoImageUrl: "/images/CodeDetails_IconLogo.png",
        },
      }}
    >
      {variant === "terminal" ? (
        // Terminal Style
        <div className="flex items-center space-x-2">
          <span className="text-green-400">$</span>
          <div className="flex items-center text-xl relative bg-clip-text text-transparent bg-gradient-to-r from-lime-500 to-green-500 hover:from-yellow-300 hover:to-orange-400 transition-all duration-300 cursor-pointer font-mono">
            {useTypingEffect ? (
              <TextTypingEffectAnimation
                className="text-xl"
                text={text}
                speed={animationSpeed}
              />
            ) : (
              <span>{text}</span>
            )}
          </div>
        </div>
      ) : (
        // Plain Style
        <Button
          size="sm"
          className={cn(
            "relative hover:scale-105 transition-transform cursor-pointer",
            useTypingEffect && "min-w-[100px]"
          )}
        >
          {useTypingEffect ? (
            <TextTypingEffectAnimation text={text} speed={animationSpeed} />
          ) : (
            text
          )}
        </Button>
      )}
    </SignInButton>
  );
};
