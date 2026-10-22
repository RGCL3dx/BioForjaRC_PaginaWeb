import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmModal } from './ConfirmModal'

describe('ConfirmModal', () => {
  it('no renderiza nada cuando está cerrado', () => {
    render(
      <ConfirmModal abierto={false} titulo="Eliminar" onConfirmar={vi.fn()} onCancelar={vi.fn()}>
        <p>Contenido</p>
      </ConfirmModal>,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('muestra el contenido y dispara las acciones', () => {
    const onConfirmar = vi.fn()
    const onCancelar = vi.fn()
    render(
      <ConfirmModal
        abierto
        titulo="Eliminar dirección"
        textoConfirmar="Eliminar"
        variante="danger"
        onConfirmar={onConfirmar}
        onCancelar={onCancelar}
      >
        <p>Esta acción no se puede deshacer.</p>
      </ConfirmModal>,
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Eliminar dirección' })).toBeInTheDocument()
    expect(screen.getByText('Esta acción no se puede deshacer.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    expect(onConfirmar).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCancelar).toHaveBeenCalledTimes(1)
  })

  it('deshabilita la confirmación mientras está ocupado', () => {
    render(
      <ConfirmModal
        abierto
        titulo="Procesando"
        textoConfirmar="Guardar"
        ocupado
        onConfirmar={vi.fn()}
        onCancelar={vi.fn()}
      >
        <p>Espera un momento.</p>
      </ConfirmModal>,
    )
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled()
  })
})
