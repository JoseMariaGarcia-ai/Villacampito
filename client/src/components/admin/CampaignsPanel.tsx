// client/src/components/admin/CampaignsPanel.tsx
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Send, Loader2, Pause, Play, Ban, Search, Megaphone } from "lucide-react";

type Props = { password: string };

const STATUS_LABEL: Record<string, string> = {
  running: "En curso",
  paused: "Pausada",
  completed: "Completada",
  cancelled: "Cancelada",
};

const STATUS_CLASS: Record<string, string> = {
  running: "bg-green-100 text-green-800",
  paused: "bg-yellow-100 text-yellow-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-gray-100 text-gray-600",
};

export default function CampaignsPanel({ password }: Props) {
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const utils = trpc.useUtils();

  const clients = trpc.clients.getAll.useQuery({ password, search });
  const campaigns = trpc.whatsapp.campaigns.getAll.useQuery({ password }, { refetchInterval: 10000 });

  const create = trpc.whatsapp.campaigns.create.useMutation({
    onSuccess: () => {
      toast.success("Campaña creada, el envío empezará en unos segundos");
      setMessage("");
      setSelectedIds(new Set());
      utils.whatsapp.campaigns.getAll.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const pause = trpc.whatsapp.campaigns.pause.useMutation({
    onSuccess: () => utils.whatsapp.campaigns.getAll.invalidate(),
  });
  const resume = trpc.whatsapp.campaigns.resume.useMutation({
    onSuccess: () => utils.whatsapp.campaigns.getAll.invalidate(),
  });
  const cancel = trpc.whatsapp.campaigns.cancel.useMutation({
    onSuccess: () => utils.whatsapp.campaigns.getAll.invalidate(),
  });

  const toggleClient = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    const visible = clients.data?.clients ?? [];
    setSelectedIds(new Set(visible.map((c) => c.id)));
  };

  const handleCreate = () => {
    if (!message.trim() || selectedIds.size === 0) return;
    create.mutate({ password, message: message.trim(), clientIds: [...selectedIds] });
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
        <p className="font-medium mb-1">Anti-baneo activado</p>
        <p>
          Los mensajes se envían con un intervalo aleatorio de ~90-150 segundos, en orden aleatorio y con
          pausas extra cada 25 envíos, respetando un límite diario. La campaña puede tardar en completarse.
        </p>
      </div>

      {/* Compose */}
      <div className="flex flex-col gap-3">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Escribe el mensaje de la campaña..."
          rows={4}
          className="text-sm"
        />

        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">
            Destinatarios ({selectedIds.size} seleccionados)
          </p>
          <button onClick={selectAllVisible} className="text-xs text-[oklch(0.28_0.07_245)] hover:underline">
            Seleccionar todos los visibles
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o teléfono..."
            className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.28_0.07_245)]"
          />
        </div>

        <div className="max-h-56 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-50">
          {clients.isLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>
          ) : clients.data && clients.data.clients.length > 0 ? (
            clients.data.clients.map((c) => (
              <label key={c.id} className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedIds.has(c.id)}
                  onChange={() => toggleClient(c.id)}
                  className="accent-[oklch(0.28_0.07_245)]"
                />
                <span className="font-medium text-gray-800">{c.name}</span>
                <span className="text-gray-400 text-xs">{c.phone}</span>
              </label>
            ))
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">Sin clientes</p>
          )}
        </div>

        <Button
          onClick={handleCreate}
          disabled={!message.trim() || selectedIds.size === 0 || create.isPending}
          className="bg-[oklch(0.28_0.07_245)] hover:opacity-90 self-start"
        >
          {create.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
          Lanzar campaña
        </Button>
      </div>

      {/* Campaign list */}
      <div className="flex flex-col gap-3">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Megaphone className="w-4 h-4" /> Campañas
        </h3>
        {campaigns.data && campaigns.data.length > 0 ? (
          campaigns.data.map((c) => (
            <div key={c.id} className="border border-gray-100 rounded-lg p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Badge className={STATUS_CLASS[c.status]}>{STATUS_LABEL[c.status]}</Badge>
                <span className="text-xs text-gray-400">
                  {new Date(c.createdAt).toLocaleString("es-ES")}
                </span>
              </div>
              <p className="text-sm text-gray-700 line-clamp-2">{c.message}</p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  {c.sentCount} / {c.totalRecipients} enviados
                </p>
                <div className="w-40 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${c.totalRecipients ? (c.sentCount / c.totalRecipients) * 100 : 0}%` }}
                  />
                </div>
              </div>
              {c.status === "running" || c.status === "paused" ? (
                <div className="flex gap-2 mt-1">
                  {c.status === "running" ? (
                    <Button size="sm" variant="outline" onClick={() => pause.mutate({ password, id: c.id })}>
                      <Pause className="w-3 h-3 mr-1" /> Pausar
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => resume.mutate({ password, id: c.id })}>
                      <Play className="w-3 h-3 mr-1" /> Reanudar
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => cancel.mutate({ password, id: c.id })}>
                    <Ban className="w-3 h-3 mr-1" /> Cancelar
                  </Button>
                </div>
              ) : null}
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-400 text-center py-6">Sin campañas aún</p>
        )}
      </div>
    </div>
  );
}
