'use client'

import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'

type NavUserAvatarProps = {
	name: string
	image?: string | null
}

export function NavUserAvatar({ name, image }: NavUserAvatarProps) {
	return (
		<Avatar className="size-8 rounded-lg">
			{image && <AvatarImage alt={name} src={image} />}
			<AvatarFallback className="rounded-lg">{name.charAt(0).toUpperCase()}</AvatarFallback>
		</Avatar>
	)
}
