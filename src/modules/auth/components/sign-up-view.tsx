import { Anchor } from '@components/ui/anchor'
import { SignUpForm } from '../forms'

export function SignUpView() {
	return (
		<section className="space-y-6">
			<header className="flex flex-col gap-0.5">
				<h1 className="font-bold text-2xl text-foreground">Criar conta</h1>
				<p className="text-base text-muted-foreground">Insira seus dados para criar sua conta</p>
			</header>

			<main>
				<SignUpForm />
			</main>

			<footer>
				<p className="text-muted-foreground text-sm">
					Já tem uma conta?{' '}
					<Anchor href="/auth/login" prefetch>
						Faça login
					</Anchor>
				</p>
			</footer>
		</section>
	)
}
