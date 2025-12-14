import type { SVGProps } from 'react'

export function LogoIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg
			className="text-accent"
			fill="none"
			height="40"
			viewBox="0 0 16 16"
			width="40"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<title>twincanm ui</title>
			<path
				clipRule="evenodd"
				d="M9.58 1.077a.75.75 0 0 1 .405.82L9.165 6h4.085a.75.75 0 0 1 .567 1.241l-6.5 7.5a.75.75 0 0 1-1.302-.638L6.835 10H2.75a.75.75 0 0 1-.567-1.241l6.5-7.5a.75.75 0 0 1 .897-.182"
				fill="currentColor"
				fillRule="evenodd"
			/>
		</svg>
	)
}

export function Logo() {
	return (
		<div className="flex items-center gap-1">
			<LogoIcon />
			<b className="font-extrabold text-2xl text-primary">twincam</b>
		</div>
	)
}
