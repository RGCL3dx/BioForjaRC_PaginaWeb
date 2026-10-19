# Backend BioForjaRC — Microservicios

Arquitectura de microservicios con patrón **CRS** (Controller – Repository – Service).
Cada servicio de negocio tiene **su propia base de datos PostgreSQL** y **no** consulta
la base de datos de otro servicio.

## Puertos

| Servicio | Puerto | Requerimientos que cubre |
|---|---|---|
| `api-gateway` | 8090 | Punto único de entrada + CORS |
| `ms-usuarios` | 8091 | EP-02 (registro, login, administración de cuentas) |
| `ms-catalogo` | 8092 | EP-01 (catálogo) y EP-08 (productos y stock) |
| `ms-envios` | 8093 | EP-06 (zonas, tarifas y métodos de despacho) |
| `ms-pedidos` | 8094 | EP-03 (pedidos y pago) y EP-09 (historial y reportes) |
| `ms-cotizaciones` | 8095 | EP-04 (cotizaciones con archivos 3D) |
| `ms-consultas` | 8096 | EP-05 (mensajes de consulta) |

> Los puertos 8080 y 8082 **no** se usan en este equipo: el 8080 está ocupado por
> otro proceso Java ajeno al proyecto y el 8082 está excluido por Windows
> (rangos reservados de Hyper-V/WinNAT). Por eso el rango base es **8090-8096**.

## Requisitos

- JDK 25
- Maven Wrapper incluido en cada servicio (`mvnw.cmd` / `./mvnw`), no requiere Maven instalado
- PostgreSQL 18 local

## Cómo ejecutar un servicio

```powershell
cd backend\<servicio>
.\mvnw.cmd spring-boot:run
```

El frontend consume **únicamente** el API Gateway en `http://localhost:8090`.
