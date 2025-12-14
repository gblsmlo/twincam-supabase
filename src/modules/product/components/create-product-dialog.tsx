'use client'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spiner'
import { Plus } from 'lucide-react'
import { useId, useState, useTransition } from 'react'
import { CreateProductForm } from '../forms'

type CreateProductDialogProps = {
	trigger?: React.ReactNode
}

export function CreateProductDialog({ trigger }: CreateProductDialogProps) {
	const [open, setOpen] = useState(false)
	const [isPending] = useTransition()
	const formId = useId()

	const handleSuccess = () => {
		setOpen(false)
	}

	return (
		<Dialog onOpenChange={setOpen} open={open}>
			<DialogTrigger asChild>
				{trigger || (
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						Novo Produto
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="sm:max-w-[525px]">
				<DialogHeader>
					<DialogTitle>Criar Produto</DialogTitle>
					<DialogDescription>
						Preencha os dados abaixo para criar um novo produto. Clique em salvar quando terminar.
					</DialogDescription>
				</DialogHeader>

				<CreateProductForm onSuccess={handleSuccess} submitButtonId={formId} />

				<DialogFooter>
					<Button disabled={isPending} onClick={() => setOpen(false)} variant="outline">
						Cancelar
					</Button>
					<Button disabled={isPending} form={formId} type="submit">
						{isPending && <Spinner />}
						Salvar Produto
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
