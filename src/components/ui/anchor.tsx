import { cn } from '@lib/utils'
import Link, { type LinkProps } from 'next/link'
import type { ReactNode } from 'react'

interface AnchorProps extends LinkProps {
	children: ReactNode
	className?: string
}

export function Anchor({ children, className, ...props }: AnchorProps) {
	return (
		<Link {...props} className={cn('font-semibold text-primary hover:underline', className)}>
			{children}
		</Link>
	)
}
