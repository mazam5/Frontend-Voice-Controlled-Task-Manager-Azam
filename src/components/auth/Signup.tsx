import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
import { Eye, EyeOff, Check, Info, Loader2 } from "lucide-react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { signupFormSchema } from "@/lib/form"
import { api } from "@/lib/api"

interface ValidationItemProps {
  checked: boolean;
  text: string;
  isVisible: boolean;
  onHidden: () => void;
}

interface SignUpProps {
  onRegisterSuccess?: () => void;
}

const ValidationItem = ({ checked, text, isVisible, onHidden }: ValidationItemProps) => {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    if (checked) {
      const timer = setTimeout(() => {
        setIsAnimatingOut(true);
        const hideTimer = setTimeout(() => {
          onHidden();
        }, 300);
        return () => clearTimeout(hideTimer);
      }, 600);
      return () => clearTimeout(timer);
    } else {
      setIsAnimatingOut(false);
    }
  }, [checked, onHidden]);

  if (!isVisible) return null;

  return (
    <li
      className={`flex items-center gap-2 transition-all duration-300 transform ${isAnimatingOut
          ? "opacity-0 max-h-0 -translate-x-2 scale-95 overflow-hidden py-0 my-0 border-none"
          : "opacity-100 max-h-8"
        }`}
    >
      {checked ? (
        <Check className="w-4 h-4 text-emerald-400 shrink-0 scale-110 transition-transform duration-200" />
      ) : (
        <div className="w-4 h-4 rounded-full border border-slate-600 shrink-0" />
      )}
      <span
        className={`transition-colors duration-300 ${checked ? "text-emerald-400 line-through opacity-80" : "text-slate-400"
          }`}
      >
        {text}
      </span>
    </li>
  );
};

const SignUp = ({ onRegisterSuccess }: SignUpProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isHoverCardOpen, setIsHoverCardOpen] = useState(false);

  const form = useForm<z.infer<typeof signupFormSchema>>({
    resolver: zodResolver(signupFormSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const passwordValue = form.watch("password") || "";
  const checks = {
    length: passwordValue.length >= 8,
    uppercase: /[A-Z]/.test(passwordValue),
    lowercase: /[a-z]/.test(passwordValue),
    number: /[0-9]/.test(passwordValue),
    special: /[^A-Za-z0-9]/.test(passwordValue),
  };

  const [visibleItems, setVisibleItems] = useState({
    length: true,
    uppercase: true,
    lowercase: true,
    number: true,
    special: true,
  });

  useEffect(() => {
    setVisibleItems(prev => {
      const next = { ...prev };
      let changed = false;
      if (!checks.length && !prev.length) { next.length = true; changed = true; }
      if (!checks.uppercase && !prev.uppercase) { next.uppercase = true; changed = true; }
      if (!checks.lowercase && !prev.lowercase) { next.lowercase = true; changed = true; }
      if (!checks.number && !prev.number) { next.number = true; changed = true; }
      if (!checks.special && !prev.special) { next.special = true; changed = true; }
      return changed ? next : prev;
    });
  }, [checks.length, checks.uppercase, checks.lowercase, checks.number, checks.special]);

  const allHidden = Object.values(visibleItems).every(v => v === false);

  useEffect(() => {
    if (allHidden) {
      setIsHoverCardOpen(false);
    }
  }, [allHidden]);

  async function onSubmit(data: z.infer<typeof signupFormSchema>) {
    setIsLoading(true);
    try {
      await api.register({
        email: data.email,
        password: data.password
      });
      toast.success("Account created successfully! Please log in.");
      form.reset();
      if (onRegisterSuccess) {
        onRegisterSuccess();
      }
    } catch (err: any) {
      toast.error(err.message || "Registration failed. Email might already exist.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your email below to signup
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="form-signup" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="emailId">Email</FieldLabel>
                  <Input
                    {...field}
                    id="emailId"
                    type="email"
                    aria-invalid={fieldState.invalid}
                    placeholder="email@example.com"
                    autoComplete="off"
                    disabled={isLoading}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <div className="flex items-center justify-between gap-1.5">
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <span className="text-slate-500 text-[10px] italic select-none">(Hover for requirements)</span>
                  </div>
                  <HoverCard
                    open={isHoverCardOpen}
                    onOpenChange={(open) => setIsHoverCardOpen(allHidden ? false : open)}
                    openDelay={100}
                    closeDelay={100}
                  >
                    <HoverCardTrigger asChild>
                      <div className="relative w-full">
                        <Input
                          {...field}
                          id="password"
                          type={showPassword ? "text" : "password"}
                          className="pr-10"
                          disabled={isLoading}
                        />
                        <Button
                          variant="ghost"
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                          title={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4.5 h-4.5" />
                          ) : (
                            <Eye className="w-4.5 h-4.5" />
                          )}
                        </Button>
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent className="glass-panel border-white/10 w-72 p-4 text-slate-200">
                      <h4 className="font-semibold text-xs text-slate-300 mb-2.5 uppercase tracking-wider flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-indigo-400" />
                        Remaining Requirements
                      </h4>
                      <ul className="space-y-2 text-xs overflow-hidden transition-all duration-300">
                        <ValidationItem
                          checked={checks.length}
                          text="At least 8 characters long"
                          isVisible={visibleItems.length}
                          onHidden={() => setVisibleItems(prev => ({ ...prev, length: false }))}
                        />
                        <ValidationItem
                          checked={checks.uppercase}
                          text="At least one uppercase letter (A-Z)"
                          isVisible={visibleItems.uppercase}
                          onHidden={() => setVisibleItems(prev => ({ ...prev, uppercase: false }))}
                        />
                        <ValidationItem
                          checked={checks.lowercase}
                          text="At least one lowercase letter (a-z)"
                          isVisible={visibleItems.lowercase}
                          onHidden={() => setVisibleItems(prev => ({ ...prev, lowercase: false }))}
                        />
                        <ValidationItem
                          checked={checks.number}
                          text="At least one numerical digit (0-9)"
                          isVisible={visibleItems.number}
                          onHidden={() => setVisibleItems(prev => ({ ...prev, number: false }))}
                        />
                        <ValidationItem
                          checked={checks.special}
                          text="At least one special character (e.g. !@#$%)"
                          isVisible={visibleItems.special}
                          onHidden={() => setVisibleItems(prev => ({ ...prev, special: false }))}
                        />
                      </ul>
                    </HoverCardContent>
                  </HoverCard>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                  <div className="relative w-full">
                    <Input
                      {...field}
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      className="pr-10"
                      disabled={isLoading}
                    />
                    <Button
                      variant="ghost"
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4.5 h-4.5" />
                      ) : (
                        <Eye className="w-4.5 h-4.5" />
                      )}
                    </Button>
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button
          type="submit"
          form="form-signup"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />
              Signing up...
            </>
          ) : (
            "Sign Up"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SignUp;