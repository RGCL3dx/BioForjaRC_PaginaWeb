package cl.bioforjarc.catalogo.service.impl;

import cl.bioforjarc.catalogo.dto.CategoriaResponse;
import cl.bioforjarc.catalogo.repository.CategoriaRepository;
import cl.bioforjarc.catalogo.service.CategoriaService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class CategoriaServiceImpl implements CategoriaService {

    private final CategoriaRepository categoriaRepository;

    public CategoriaServiceImpl(CategoriaRepository categoriaRepository) {
        this.categoriaRepository = categoriaRepository;
    }

    @Override
    public List<CategoriaResponse> listar() {
        return categoriaRepository.findAllByOrderByOrdenAscNombreAsc()
                .stream()
                .map(CategoriaResponse::desde)
                .toList();
    }
}
