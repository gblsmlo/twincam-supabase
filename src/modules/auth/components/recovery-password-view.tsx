import { Anchor } from '@components/ui/anchor'
import { RecoveryPasswordForm } from '../forms'

export function RecoveryPasswordView() {
	return (
		<section className="space-y-6">
			<header className="flex flex-col gap-0.5">
				<h1 className="font-bold text-2xl text-foreground">Recuperar senha</h1>
				<p className="text-base text-muted-foreground">Insira seu email para recuperar sua senha</p>
			</header>

			<main>
				<RecoveryPasswordForm />
			</main>

			<footer>
				<p className="text-muted-foreground text-sm">
					Lembre-se de sua senha?{' '}
					<Anchor href="/auth/login" prefetch>
						Fazer login
					</Anchor>
				</p>
			</footer>
		</section>
	)
}
