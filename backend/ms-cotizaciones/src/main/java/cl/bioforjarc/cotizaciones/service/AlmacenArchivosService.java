package cl.bioforjarc.cotizaciones.service;

import cl.bioforjarc.cotizaciones.exception.AlmacenamientoException;
import cl.bioforjarc.cotizaciones.exception.RecursoNoEncontradoException;
import cl.bioforjarc.cotizaciones.exception.SolicitudInvalidaException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/**
 * Guarda y recupera los archivos 3D fuera del repositorio. HU-04.1 admite
 * unicos .STL y .OBJ de hasta 50 MB por archivo.
 */
@Service
public class AlmacenArchivosService {

    private static final Set<String> EXTENSIONES_PERMITIDAS = Set.of("stl", "obj");

    private final Path directorioBase;
    private final int maxArchivos;
    private final long tamanoMaximoBytes;

    public AlmacenArchivosService(
            @Value("${bioforja.archivos.directorio}") String directorio,
            @Value("${bioforja.archivos.max-archivos:5}") int maxArchivos,
            @Value("${bioforja.archivos.tamano-maximo-bytes:52428800}") long tamanoMaximoBytes) {

        this.directorioBase = Paths.get(directorio).toAbsolutePath().normalize();
        this.maxArchivos = maxArchivos;
        this.tamanoMaximoBytes = tamanoMaximoBytes;
        try {
            Files.createDirectories(this.directorioBase);
        } catch (IOException ex) {
            throw new IllegalStateException(
                    "No se pudo crear el directorio de archivos: " + this.directorioBase, ex);
        }
    }

    public List<ArchivoGuardado> guardar(String numeroTicket, List<MultipartFile> archivos) {
        List<MultipartFile> recibidos = archivos == null ? List.of() : archivos.stream()
                .filter(archivo -> archivo != null && !archivo.isEmpty())
                .toList();

        if (recibidos.size() > maxArchivos) {
            throw new SolicitudInvalidaException(
                    "Se permiten como maximo " + maxArchivos + " archivos por cotizacion");
        }
        if (recibidos.isEmpty()) {
            return List.of();
        }

        Path carpeta = resolverCarpeta(numeroTicket);
        try {
            Files.createDirectories(carpeta);
        } catch (IOException ex) {
            throw new AlmacenamientoException("No se pudo preparar la carpeta de archivos", ex);
        }

        List<ArchivoGuardado> guardados = new ArrayList<>();
        try {
            for (MultipartFile archivo : recibidos) {
                validar(archivo);
                String nombreOriginal = nombreSeguro(archivo.getOriginalFilename());
                String extension = extensionDe(nombreOriginal);
                String nombreAlmacenado = UUID.randomUUID() + "." + extension;
                Path destino = carpeta.resolve(nombreAlmacenado).normalize();
                if (!destino.startsWith(carpeta)) {
                    throw new SolicitudInvalidaException("El nombre del archivo no es valido");
                }
                try (InputStream entrada = archivo.getInputStream()) {
                    Files.copy(entrada, destino, StandardCopyOption.REPLACE_EXISTING);
                }
                guardados.add(new ArchivoGuardado(
                        nombreOriginal,
                        extension,
                        tipoContenido(archivo),
                        archivo.getSize(),
                        numeroTicket + "/" + nombreAlmacenado,
                        LocalDateTime.now()));
            }
            return guardados;
        } catch (SolicitudInvalidaException | IOException ex) {
            eliminar(guardados);
            if (ex instanceof SolicitudInvalidaException solicitud) {
                throw solicitud;
            }
            throw new AlmacenamientoException("No se pudieron guardar los archivos de la cotizacion", ex);
        }
    }

    public Resource cargar(String rutaRelativa) {
        Path ruta = resolverArchivo(rutaRelativa);
        if (!Files.isRegularFile(ruta)) {
            throw new RecursoNoEncontradoException("El archivo solicitado no existe");
        }
        return new FileSystemResource(ruta);
    }

    public void eliminar(List<ArchivoGuardado> archivos) {
        if (archivos == null) {
            return;
        }
        for (ArchivoGuardado archivo : archivos) {
            try {
                Files.deleteIfExists(resolverArchivo(archivo.rutaRelativa()));
            } catch (IOException | RecursoNoEncontradoException ex) {
                // La limpieza es best-effort: no debe ocultar el error original.
            }
        }
    }

    private void validar(MultipartFile archivo) {
        String nombreOriginal = nombreSeguro(archivo.getOriginalFilename());
        if (nombreOriginal.isBlank()) {
            throw new SolicitudInvalidaException("El archivo no tiene nombre");
        }
        if (archivo.getSize() <= 0) {
            throw new SolicitudInvalidaException("El archivo " + nombreOriginal + " esta vacio");
        }
        if (archivo.getSize() > tamanoMaximoBytes) {
            throw new SolicitudInvalidaException(
                    "El archivo " + nombreOriginal + " supera el maximo de 50 MB");
        }
        String extension = extensionDe(nombreOriginal);
        if (!EXTENSIONES_PERMITIDAS.contains(extension)) {
            throw new SolicitudInvalidaException(
                    "Solo se permiten archivos .STL o .OBJ (recibido: " + nombreOriginal + ")");
        }
    }

    private String nombreSeguro(String nombreOriginal) {
        if (nombreOriginal == null) {
            return "";
        }
        String normalizado = nombreOriginal.replace('\\', '/');
        int separador = normalizado.lastIndexOf('/');
        return (separador >= 0 ? normalizado.substring(separador + 1) : normalizado).trim();
    }

    private String extensionDe(String nombre) {
        int punto = nombre.lastIndexOf('.');
        if (punto < 0 || punto == nombre.length() - 1) {
            throw new SolicitudInvalidaException(
                    "Solo se permiten archivos .STL o .OBJ (recibido: " + nombre + ")");
        }
        return nombre.substring(punto + 1).toLowerCase(Locale.ROOT);
    }

    private String tipoContenido(MultipartFile archivo) {
        String tipo = archivo.getContentType();
        if (tipo == null || tipo.isBlank()) {
            tipo = "application/octet-stream";
        }
        return tipo.length() > 120 ? tipo.substring(0, 120) : tipo;
    }

    private Path resolverCarpeta(String numeroTicket) {
        if (numeroTicket == null || !numeroTicket.matches("[A-Z0-9-]+")) {
            throw new SolicitudInvalidaException("El numero de ticket no es valido");
        }
        Path carpeta = directorioBase.resolve(numeroTicket).normalize();
        if (!carpeta.startsWith(directorioBase)) {
            throw new SolicitudInvalidaException("La ruta del ticket no es valida");
        }
        return carpeta;
    }

    private Path resolverArchivo(String rutaRelativa) {
        if (rutaRelativa == null || rutaRelativa.isBlank()) {
            throw new RecursoNoEncontradoException("El archivo solicitado no existe");
        }
        Path ruta = directorioBase.resolve(rutaRelativa).normalize();
        if (!ruta.startsWith(directorioBase)) {
            throw new RecursoNoEncontradoException("El archivo solicitado no existe");
        }
        return ruta;
    }
}
