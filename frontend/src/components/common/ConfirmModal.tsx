import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'

interface ConfirmModalProps {
  abierto: boolean
  titulo: string
  children: ReactNode
  textoConfirmar?: string
  textoCancelar?: string
  variante?: 'danger' | 'primary' | 'success'
  ocupado?: boolean
  onConfirmar: () => void
  onCancelar: () => void
}

const variantes = {
  danger: 'destructive',
  primary: 'default',
  success: 'default',
} as const

export function ConfirmModal({
  abierto,
  titulo,
  children,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  variante = 'danger',
  ocupado = false,
  onConfirmar,
  onCancelar,
}: ConfirmModalProps) {
  return (
    <Dialog
      open={abierto}
      onOpenChange={(abiertoAhora) => {
        if (!abiertoAhora && !ocupado) onCancelar()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription className="sr-only">
            Confirma o cancela la acción solicitada.
          </DialogDescription>
        </DialogHeader>
        <div className="text-sm text-muted-foreground">{children}</div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancelar} disabled={ocupado}>
            {textoCancelar}
          </Button>
          <Button
            type="button"
            variant={variantes[variante]}
            onClick={onConfirmar}
            disabled={ocupado}
          >
            {ocupado && <Spinner className="size-4" />}
            {textoConfirmar}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
