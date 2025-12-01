import type { ReactNode } from 'react'

export function PageHeader({ children }: { children: ReactNode }) {
	return <header className="flex flex-col gap-0.5">{children}</header>
}

export function PageTitle({ children }: { children: ReactNode }) {
	return <h1 className="font-semibold text-xl 2xl:text-2xl">{children}</h1>
}

export function PageDescription({ children }: { children: ReactNode }) {
	return <p className="text-base text-muted-foreground">{children}</p>
}
