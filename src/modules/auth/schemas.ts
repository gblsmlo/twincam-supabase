import { z } from 'zod'

const emailSchema = z.email('Insira um email válido.')
const nameSchema = z
	.string('Insira seu nome completo.')
	.min(2, 'O nome deve ter no mínimo 2 caracteres.')
const passwordSchema = z.string().min(6, 'A senha deve ter no mínimo 6 caracteres.')

export const signUpSchema = z.object({
	email: emailSchema,
	name: nameSchema,
	password: passwordSchema,
})

export const signInSchema = z.object({
	email: emailSchema,
	password: passwordSchema,
})

export const recoveryPasswordSchema = z.object({
	email: emailSchema,
})

export type SignUpFormData = z.infer<typeof signUpSchema>
export type SignInFormData = z.infer<typeof signInSchema>
export type RecoveryPasswordFormData = z.infer<typeof recoveryPasswordSchema>
