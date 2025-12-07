import { MainContent } from '@/components/ui/main-content'
import type { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Onboarding',
}

export default function Page() {
	const title = String(metadata.title)

	return <MainContent size="2xl">{title}</MainContent>
}
