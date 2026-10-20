package cl.bioforjarc.cotizaciones.service;

import cl.bioforjarc.cotizaciones.exception.RecursoNoEncontradoException;
import cl.bioforjarc.cotizaciones.exception.SolicitudInvalidaException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.Resource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AlmacenArchivosServiceTest {

    private static final String TICKET = "COT-20261019-000001";

    @TempDir
    Path directorio;

    private AlmacenArchivosService almacen;

    @BeforeEach
    void preparar() {
        almacen = new AlmacenArchivosService(directorio.toString(), 2, 10);
    }

    @Test
    void guardaArchivosStlYObjEnLaCarpetaDelTicket() throws Exception {
        MockMultipartFile stl = archivo("pieza.stl", "model/stl", "solid");
        MockMultipartFile obj = archivo("pieza.obj", "model/obj", "v 0 0 0");

        List<ArchivoGuardado> guardados = almacen.guardar(TICKET, List.of(stl, obj));

        assertEquals(2, guardados.size());
        assertEquals("pieza.stl", guardados.get(0).nombreOriginal());
        assertEquals("stl", guardados.get(0).extension());
        assertEquals(5, guardados.get(0).tamano());
        assertTrue(guardados.get(0).rutaRelativa().startsWith(TICKET + "/"));
        Path rutaStl = directorio.resolve(guardados.get(0).rutaRelativa());
        assertTrue(Files.exists(rutaStl));
        assertArrayEquals("solid".getBytes(StandardCharsets.UTF_8), Files.readAllBytes(rutaStl));

        Resource recurso = almacen.cargar(guardados.get(0).rutaRelativa());
        assertArrayEquals("solid".getBytes(StandardCharsets.UTF_8), recurso.getInputStream().readAllBytes());
    }

    @Test
    void aceptaNombreConRutaDeWindowsSinSalirDelDirectorio() {
        MockMultipartFile archivo = archivo("C:\\fakepath\\pieza.STL", "application/octet-stream", "solid");

        List<ArchivoGuardado> guardados = almacen.guardar(TICKET, List.of(archivo));

        assertEquals("pieza.STL", guardados.get(0).nombreOriginal());
        assertEquals("stl", guardados.get(0).extension());
        assertTrue(Files.exists(directorio.resolve(guardados.get(0).rutaRelativa())));
        assertTrue(directorio.resolve(guardados.get(0).rutaRelativa()).normalize()
                .startsWith(directorio.normalize()));
    }

    @Test
    void rechazaExtensionesDistintasDeStlUObj() {
        MockMultipartFile archivo = archivo("pieza.txt", "text/plain", "hola");

        SolicitudInvalidaException error = assertThrows(SolicitudInvalidaException.class,
                () -> almacen.guardar(TICKET, List.of(archivo)));

        assertTrue(error.getMessage().contains("STL"));
    }

    @Test
    void rechazaArchivoSobreElTamanoMaximoYNoDejaBasura() throws Exception {
        MockMultipartFile archivo = archivo("grande.stl", "model/stl", "12345678901");

        assertThrows(SolicitudInvalidaException.class,
                () -> almacen.guardar(TICKET, List.of(archivo)));

        try (var rutas = Files.walk(directorio)) {
            assertEquals(0, rutas.filter(Files::isRegularFile).count());
        }
    }

    @Test
    void rechazaMasArchivosQueElMaximoConfigurado() {
        List<MultipartFile> archivos = List.of(
                archivo("a.stl", "model/stl", "a"),
                archivo("b.stl", "model/stl", "b"),
                archivo("c.obj", "model/obj", "c"));

        assertThrows(SolicitudInvalidaException.class,
                () -> almacen.guardar(TICKET, archivos));
    }

    @Test
    void ignoraPartesVacias() {
        MockMultipartFile vacio = archivo("vacio.stl", "model/stl", "");

        List<ArchivoGuardado> guardados = almacen.guardar(TICKET, List.of(vacio));

        assertTrue(guardados.isEmpty());
    }

    @Test
    void noPermiteLeerFueraDelDirectorio() {
        assertThrows(RecursoNoEncontradoException.class, () -> almacen.cargar("../secreto.stl"));
    }

    @Test
    void noPermiteTicketsConRuta() {
        assertThrows(SolicitudInvalidaException.class,
                () -> almacen.guardar("../otro", List.of(archivo("a.stl", "model/stl", "a"))));
    }

    private MockMultipartFile archivo(String nombre, String tipo, String contenido) {
        return new MockMultipartFile("archivos", nombre, tipo,
                contenido.getBytes(StandardCharsets.UTF_8));
    }
}
