import { useRef } from "react";
import { FileText, ImageIcon, Trash2, Upload } from "lucide-react";
import { Button } from "@/shared/components/button";
import { archivoUrl } from "@/shared/services/apiClient";

/**
 * La ficha tecnica que vino con el lote: la foto y el PDF.
 *
 * Van en dos ranuras separadas porque son dos cosas distintas. La foto se
 * reconoce de un vistazo --es lo que confirma, al iniciar la jornada, que
 * el lote es el correcto-- y el PDF se abre para leer el detalle. Tener
 * una sola ranura obligaba a escoger uno de los dos.
 *
 * Antes la ficha era un modulo entero: referencia, version, operaciones,
 * materiales y medidas transcritas a mano. En la practica cada lote llega
 * con SU ficha en papel y todas son distintas, asi que transcribirla era
 * trabajo de digitacion que nadie volvia a leer.
 */
const RANURAS = [
  {
    tipo: "imagen",
    campo: "ruta_imagen",
    titulo: "Foto de la prenda",
    icono: ImageIcon,
    accept: "image/jpeg,image/png,image/webp,image/heic",
    ayuda: "JPG, PNG, WEBP o HEIC",
  },
  {
    tipo: "pdf",
    campo: "ruta_documento_pdf",
    titulo: "Ficha en PDF",
    icono: FileText,
    accept: "application/pdf",
    ayuda: "El PDF que mando el cliente",
  },
];

function Ranura({ ranura, lote, subiendo, onSubir, onQuitar }) {
  const entrada = useRef(null);
  const ruta = archivoUrl(lote?.[ranura.campo]);
  const Icono = ranura.icono;
  const esImagen = ranura.tipo === "imagen";

  const alSeleccionar = (evento) => {
    const archivo = evento.target.files?.[0];
    // El input se limpia siempre: si no, volver a escoger el MISMO archivo
    // no dispara el evento y parece que el boton no responde.
    evento.target.value = "";
    if (archivo) onSubir?.(archivo);
  };

  return (
    <div className="flex min-w-0 flex-1 items-start gap-3 rounded-xl border border-gray-200 bg-white p-3">
      {ruta ? (
        <a href={ruta} target="_blank" rel="noreferrer" title={`Abrir ${ranura.titulo}`} className="shrink-0">
          {esImagen ? (
            <img
              src={ruta}
              alt={ranura.titulo}
              className="h-20 w-20 rounded-lg border border-gray-200 object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-gray-200 bg-gray-50 text-gray-500">
              <Icono className="h-6 w-6" />
              <span className="text-[10px] font-medium">PDF</span>
            </div>
          )}
        </a>
      ) : (
        <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 text-gray-300">
          <Icono className="h-5 w-5" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-800">{ranura.titulo}</p>
        <p className="mt-0.5 text-xs text-gray-400">{ranura.ayuda} · max 8 MB</p>

        <div className="mt-2 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => entrada.current?.click()}
            disabled={subiendo}
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            {ruta ? "Reemplazar" : "Subir"}
          </Button>

          {ruta && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onQuitar?.(lote.id_lote, ranura.tipo)}
              disabled={subiendo}
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <input
        ref={entrada}
        type="file"
        accept={ranura.accept}
        onChange={alSeleccionar}
        className="hidden"
      />
    </div>
  );
}

export function FichaTecnicaLote({ lote, subiendo = false, onSubir, onQuitar, compacto = false }) {
  return (
    <div className={compacto ? "" : "rounded-2xl border border-gray-200 bg-gray-50/60 p-4"}>
      {!compacto && (
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#0F4C3F]">
          Ficha tecnica
        </h4>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        {RANURAS.map((ranura) => (
          <Ranura
            key={ranura.tipo}
            ranura={ranura}
            lote={lote}
            subiendo={subiendo}
            onSubir={(archivo) => onSubir?.(lote.id_lote, archivo)}
            onQuitar={onQuitar}
          />
        ))}
      </div>
    </div>
  );
}
