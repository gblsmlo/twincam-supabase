import { Logo } from '@components/logo'
import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import AuthGuard from './auth-guard'

export function AuthLayout({ children }: { children: ReactNode }) {
	return (
		<AuthGuard>
			<div className="grid min-h-svh lg:grid-cols-5">
				<div className="flex flex-col gap-4 p-6 md:p-10 lg:col-span-3">
					<div className="flex justify-center gap-2 md:justify-start">
						<Link href="/">
							<Logo />
						</Link>
					</div>
					<div className="flex flex-1 items-center justify-center">
						<div className="w-full max-w-sm">{children}</div>
					</div>
				</div>
				<div className="relative hidden overflow-hidden rounded-2xl bg-foreground lg:col-span-2 lg:m-6 lg:block">
					<Image alt="Login" className="object-cover opacity-70" fill src="/auth.jpg" />
				</div>
			</div>
		</AuthGuard>
	)
}
