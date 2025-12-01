import { Anchor } from '@components/ui/anchor'
import { SignInForm } from '../forms'

export function SignInView() {
	return (
		<section className="space-y-6">
			<header className="flex flex-col gap-0.5">
				<h1 className="font-bold text-2xl text-foreground">Entrar</h1>
				<p className="text-base text-muted-foreground">
					Insira suas credenciais para acessar sua conta
				</p>
			</header>

			<main>
				<SignInForm />
			</main>

			<footer>
				<p className="text-muted-foreground text-sm">
					Ainda não tem uma conta?{' '}
					<Anchor href="/auth/register" prefetch>
						Crie uma
					</Anchor>
				</p>
			</footer>
		</section>
	)
}
