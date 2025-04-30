"use client";

import { SignIn } from "@clerk/nextjs";
import { Card, CardContent } from "../ui/card";
import { Lock } from "lucide-react";
import { motion } from "framer-motion";

interface SignInComponentProps {
  withIcon?: boolean;
  withTitle?: boolean;
  titleText?: string;
  subTitleText?: string;
}

export function SignInComponent({
  withIcon = true,
  withTitle = true,
  titleText = "",
  subTitleText = "",
}: SignInComponentProps) {
  return (
    <>
      {(withIcon || withTitle) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 w-full"
        >
          {withIcon && (
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-primary" />
            </div>
          )}
          {withTitle && (
            <>
              <h1 className="text-2xl font-semibold">{titleText}</h1>
              <p className="text-sm text-muted-foreground mt-2">
                {subTitleText}
              </p>
            </>
          )}
        </motion.div>
      )}

      <Card className="w-full bg-background shadow-none rounded-lg border-0 backdrop-blur-sm">
        <CardContent className="p-0">
          <SignIn
            path="/sign-in"
            routing="path"
            signUpUrl="/sign-up"
            appearance={{
              elements: {
                card: "shadow-none bg-transparent/1 backdrop-blur-sm",
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
                formFieldInputError:
                  "bg-destructive/10 border-destructive text-destructive placeholder:text-destructive/50",
                formFieldInputSuccess:
                  "bg-success/10 border-success text-success placeholder:text-success/50",
                formFieldInputWarning:
                  "bg-warning/10 border-warning text-warning placeholder:text-warning/50",
                formFieldInputNeutral:
                  "bg-muted/10 border-muted text-muted placeholder:text-muted/50",
                formFieldInputInvalid:
                  "bg-destructive/10 border-destructive text-destructive placeholder:text-destructive/50",
                formFieldInputValid:
                  "bg-success/10 border-success text-success placeholder:text-success/50",
                footerActionText: "text-muted-foreground",
                footerActionTextLink: "text-primary hover:text-primary/90",
                footerAction: "mt-4 text-center space-x-1",
                footer: "mt-6 pt-4 border-t border-border/50",
                footerText: "text-muted-foreground text-sm",
                logoBox: "flex items-center justify-center mb-4 mt-4",
                logoImage: "w-29 h-29 object-contain",
                organizationSwitcherTrigger:
                  "bg-background border-border hover:bg-muted",
                footer__terms:
                  "text-muted-foreground hover:text-foreground text-sm",
                footer__privacy:
                  "text-muted-foreground hover:text-foreground text-sm",
                otherLoginText: "text-muted-foreground text-sm",
                alternativeMethodsBlockButton: "text-foreground hover:bg-muted",
                logoPlacement: {
                  logo: "/images/CodeDetails_IconLogo.png",
                  logoImageUrl: "/images/CodeDetails_IconLogo.png",
                  position: "inside",
                },
              },
              layout: {
                showOptionalFields: true,
                logoPlacement: "inside",
                logoImageUrl: "/images/mascot.png",
              },
            }}
          />
        </CardContent>
      </Card>
    </>
  );
}
