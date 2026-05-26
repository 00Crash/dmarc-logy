import type { ButtonHTMLAttributes } from "react";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
};

export function Button({ className, variant = "default", size = "default", ...props }: ButtonProps) {
  const variants = {
    default: "bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700",
    secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200",
    outline: "border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50",
    ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
    destructive: "bg-red-600 text-white shadow-lg shadow-red-600/20 hover:bg-red-700",
  };
  const sizes = {
    default: "h-11 px-4 py-2",
    sm: "h-9 rounded-xl px-3",
    lg: "h-12 rounded-2xl px-6",
    icon: "h-11 w-11",
  };

  return (
    <button
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-2xl text-sm font-black transition focus:outline-none focus:ring-4 focus:ring-blue-500/10 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
