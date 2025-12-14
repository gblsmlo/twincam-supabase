import { Logo } from '@/components/logo'
import { NavAuth } from '@/components/navigations/nav-auth'
import {
	Header,
	HeaderCenter,
	HeaderLeft,
	HeaderRight,
	MainContent,
	NavigationLinks,
} from '@tc96/ui-react'
import type { ReactNode } from 'react'

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<>
			<Header>
				<HeaderLeft>
					<Logo />
				</HeaderLeft>
				<HeaderCenter>
					<NavigationLinks
						data={{
							items: [
								{
									href: '/',
									title: 'Home',
								},
								{
									href: '/about',
									title: 'About',
								},
								{
									href: '/pricing',
									title: 'Pricing',
								},
								{
									href: '/contact',
									title: 'Contact',
								},
							],
						}}
					/>
				</HeaderCenter>
				<HeaderRight>
					<NavAuth />
				</HeaderRight>
			</Header>
			<MainContent size="2xl">{children}</MainContent>
		</>
	)
}
