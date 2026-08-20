import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "group relative rounded-2xl border-2 border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur-lg transition-all duration-300 ease-in-out",
  {
    variants: {
      variant: {
        default: "hover:border-blue-500/50 hover:bg-white/10",
        gradient:
          "before:absolute before:inset-0 before:rounded-2xl before:border-2 before:border-transparent before:bg-gradient-to-br before:from-blue-500/50 before:to-purple-500/50 before:bg-clip-padding before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100",
      },
      isClickable: {
        true: "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 focus-visible:ring-offset-gray-900",
      },
    },
    defaultVariants: {
      variant: "default",
      isClickable: false,
    },
  },
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  isClickable?: boolean;
}

const FeatureCard = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, isClickable, ...props }, ref) => {
    const Tag = isClickable ? "button" : "div";
    return (
      <Tag
        ref={ref as any}
        className={cn(cardVariants({ variant, isClickable }), className)}
        {...props}
      />
    );
  },
);
FeatureCard.displayName = "FeatureCard";

const CardHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight text-white",
      className,
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-gray-400", className)} {...props} />
));
CardDescription.displayName = "CardDescription";

const CardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("pt-4", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-4", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  FeatureCard,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};
