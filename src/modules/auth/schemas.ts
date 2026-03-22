import { z } from 'zod'

const emailSchema = z.email('Insira um email válido.')
const nameSchema = z
	.string('Insira seu nome completo.')
	.min(2, 'O nome deve ter no mínimo 2 caracteres.')
const passwordSchema = z.string().min(6, 'A senha deve ter no mínimo 6 caracteres.')

const organizationNameSchema = z
	.string('Insira o nome da organização.')
	.min(2, 'O nome da organização deve ter no mínimo 2 caracteres.')
const organizationSlugSchema = z
	.string('Insira o slug da organização.')
	.regex(/^[a-z0-9-]+$/, 'O slug deve conter apenas letras minúsculas, números e hífens.')
	.min(3, 'O slug deve ter no mínimo 3 caracteres.')

export const signUpSchema = z.object({
	email: emailSchema,
	name: nameSchema,
	organizationName: organizationNameSchema,
	organizationSlug: organizationSlugSchema,
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
