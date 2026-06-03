import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

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

const SignUp = () => {
	const form = useForm<z.infer<typeof signupFormSchema>>({
		resolver: zodResolver(signupFormSchema),
		mode: "onChange",
		defaultValues: {
			email: "",
			password: "",
			confirmPassword: "",
		},
	})
	function onSubmit(data: z.infer<typeof signupFormSchema>) {
		// Do something with the form values.
		console.log(data)
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
				<form id="form-rhf-demo" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="emailId">
										Email
                  </FieldLabel>
                  <Input
                    {...field}
                    id="emailId"
										aria-invalid={fieldState.invalid}
										placeholder="m@example.com"
                    autoComplete="off"
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
									<FieldLabel htmlFor="password">
										Password
									</FieldLabel>
									<Input
										{...field}
										id="password"
									/>
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
									<FieldLabel htmlFor="confirmPassword">
										Confirm Password
									</FieldLabel>
									<Input
										{...field}
										id="confirmPassword"
									/>
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
				<Button type="submit" className="w-full">
					Sign Up
        </Button>
      </CardFooter>
    </Card>
    )
}

export default SignUp