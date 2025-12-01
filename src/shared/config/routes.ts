import {
	Briefcase,
	Bug,
	Building2,
	Contact,
	DollarSign,
	FileText,
	Folder,
	HelpCircle,
	Home,
	type LucideIcon,
	Package,
	PieChart,
	ReceiptIcon,
	Settings,
	User,
	Users,
} from 'lucide-react'

export type SubRoute = {
	title: string
	link: string
	icon?: LucideIcon
}

export type Route = {
	icon?: LucideIcon | null
	label: string
	link: string
	subs?: SubRoute[]
}

export const mainRoutes: Route[] = [
	{
		icon: Home,
		label: 'Dashboard',
		link: '/dashboard',
	},
	{
		icon: PieChart,
		label: 'Analytics',
		link: '/dashboard/analytics',
	},
	{
		icon: Folder,
		label: 'Projects',
		link: '/dashboard/projects',
	},
	{
		icon: Users,
		label: 'Team',
		link: '/dashboard/team',
	},
]

export const crmRoutes: Route[] = [
	{
		icon: Contact,
		label: 'Contacts',
		link: '/dashboard/crm/contacts',
	},
	{
		icon: Building2,
		label: 'Companies',
		link: '/dashboard/crm/companies',
	},
	{
		icon: Briefcase,
		label: 'Deals',
		link: '/dashboard/crm/deals',
	},
]

export const secondaryRoutes: Route[] = [
	{
		icon: Settings,
		label: 'Settings',
		link: '/dashboard/settings',
	},
	{
		icon: HelpCircle,
		label: 'Help & Support',
		link: '/dashboard/help',
	},
	{
		icon: Bug,
		label: 'Bugs',
		link: '/dashboard/bugs',
	},
]

export const documentsRoutes: Route[] = [
	{
		icon: FileText,
		label: 'Files',
		link: '/dashboard/docs/files',
	},
	{
		icon: PieChart,
		label: 'Reports',
		link: '/dashboard/docs/reports',
	},
	{
		icon: FileText,
		label: 'Resources',
		link: '/dashboard/docs/resources',
	},
]

export const userRoutes: Route[] = [
	{
		icon: User,
		label: 'Account',
		link: '/dashboard/settings/account/profile',
	},
	{
		icon: ReceiptIcon,
		label: 'Billing',
		link: '/dashboard/billing',
	},
]

export const storeRoutes: Route[] = [
	{
		icon: Package,
		label: 'Products',
		link: '/dashboard/store/products',
	},
	{
		icon: DollarSign,
		label: 'Prices',
		link: '/dashboard/store/prices',
	},
]

export const allRoutes: Route[] = [
	...mainRoutes,
	...storeRoutes,
	...crmRoutes,
	...secondaryRoutes,
	...documentsRoutes,
	...userRoutes,
]
