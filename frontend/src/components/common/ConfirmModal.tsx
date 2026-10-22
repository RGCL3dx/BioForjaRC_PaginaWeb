import type { ReactNode } from 'react'

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
  if (!abierto) return null
  return (
    <>
      <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title h5">{titulo}</h2>
              <button type="button" className="btn-close" aria-label="Cerrar" onClick={onCancelar} />
            </div>
            <div className="modal-body">{children}</div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary rounded-pill" onClick={onCancelar}>
                {textoCancelar}
              </button>
              <button
                type="button"
                className={`btn btn-${variante} rounded-pill`}
                onClick={onConfirmar}
                disabled={ocupado}
              >
                {ocupado && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
                {textoConfirmar}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  )
}
