import { useState, useMemo, useCallback, useRef } from "react";
import { trpc } from "@/lib/trpc";
import {
  ChevronLeft, ChevronRight, Lock, Plus, Trash2, LogOut, Calendar,
  Loader2, BarChart3, Tag, Power, PowerOff, Pencil, X, Check, ImagePlus,
  MessageCircle,
} from "lucide-react";
import WhatsAppPanel from "@/components/admin/WhatsAppPanel";

const DAYS_ES = ["LU", "MA", "MI", "JU", "VI", "SA", "DO"];
const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function pad(n: number) { return n.toString().padStart(2, "0"); }
function toDateStr(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}`; }

/* ── Admin Calendar ── */
function AdminCalendar({
  password,
  occupiedDates,
  onRefresh,
}: {
  password: string;
  occupiedDates: string[];
  onRefresh: () => void;
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<"add" | "remove">("add");

  const occupiedSet = useMemo(() => new Set(occupiedDates), [occupiedDates]);

  const addMutation = trpc.calendar.addDates.useMutation({
    onSuccess: () => { setSelected(new Set()); onRefresh(); },
  });
  const removeMutation = trpc.calendar.removeDates.useMutation({
    onSuccess: () => { setSelected(new Set()); onRefresh(); },
  });

  const isLoading = addMutation.isPending || removeMutation.isPending;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7;

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelected(new Set());
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelected(new Set());
  };

  const toggleDay = useCallback((dateStr: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr);
      else next.add(dateStr);
      return next;
    });
  }, []);

  const handleApply = () => {
    const dates = Array.from(selected);
    if (dates.length === 0) return;
    if (mode === "add") {
      addMutation.mutate({ password, dates });
    } else {
      removeMutation.mutate({ password, dates });
    }
  };

  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setMode("add"); setSelected(new Set()); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            mode === "add" ? "bg-red-500 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Plus className="w-4 h-4" /> Marcar ocupados
        </button>
        <button
          onClick={() => { setMode("remove"); setSelected(new Set()); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            mode === "remove" ? "bg-green-500 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Trash2 className="w-4 h-4" /> Liberar días
        </button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h3 className="text-lg font-semibold text-gray-800">{MONTHS_ES[month]} {year}</h3>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS_ES.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-gray-500 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = toDateStr(year, month, day);
          const isOccupied = occupiedSet.has(dateStr);
          const isSelected = selected.has(dateStr);
          const isToday = dateStr === todayStr;
          const canSelect = mode === "add" ? !isOccupied : isOccupied;

          let bgClass = "bg-white hover:bg-gray-50";
          if (isOccupied && !isSelected) bgClass = "bg-red-100 text-red-700";
          if (isSelected && mode === "add") bgClass = "bg-red-500 text-white";
          if (isSelected && mode === "remove") bgClass = "bg-green-500 text-white";

          return (
            <button
              key={day}
              onClick={() => canSelect && toggleDay(dateStr)}
              disabled={!canSelect}
              className={`relative aspect-square flex items-center justify-center text-sm rounded-lg transition-all ${bgClass} ${
                !canSelect ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
              } ${isToday ? "ring-2 ring-blue-400" : ""}`}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-white border border-gray-200" /> Libre</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border border-red-200" /> Ocupado</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded ring-2 ring-blue-400" /> Hoy</span>
        {mode === "add" && <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500" /> Seleccionado (marcar)</span>}
        {mode === "remove" && <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500" /> Seleccionado (liberar)</span>}
      </div>

      {selected.size > 0 && (
        <button
          onClick={handleApply}
          disabled={isLoading}
          className={`mt-6 w-full py-3 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
            mode === "add" ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
          } ${isLoading ? "opacity-70" : ""}`}
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {mode === "add"
            ? `Marcar ${selected.size} día${selected.size > 1 ? "s" : ""} como ocupado${selected.size > 1 ? "s" : ""}`
            : `Liberar ${selected.size} día${selected.size > 1 ? "s" : ""}`}
        </button>
      )}

      {addMutation.isSuccess && (
        <p className="mt-3 text-sm text-green-600 text-center">{addMutation.data.added} día(s) marcados como ocupados.</p>
      )}
      {removeMutation.isSuccess && (
        <p className="mt-3 text-sm text-green-600 text-center">{removeMutation.data.removed} día(s) liberados.</p>
      )}
      {(addMutation.isError || removeMutation.isError) && (
        <p className="mt-3 text-sm text-red-600 text-center">Error: {addMutation.error?.message || removeMutation.error?.message}</p>
      )}
    </div>
  );
}

/* ── Offers Manager ── */
function OffersManager({ password }: { password: string }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discount, setDiscount] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.offers.getAll.useQuery({ password });

  const createMutation = trpc.offers.create.useMutation({
    onSuccess: () => {
      utils.offers.getAll.invalidate();
      utils.offers.getActive.invalidate();
      resetForm();
    },
  });

  const updateMutation = trpc.offers.update.useMutation({
    onSuccess: () => {
      utils.offers.getAll.invalidate();
      utils.offers.getActive.invalidate();
      resetForm();
    },
  });

  const toggleMutation = trpc.offers.toggleActive.useMutation({
    onSuccess: () => {
      utils.offers.getAll.invalidate();
      utils.offers.getActive.invalidate();
    },
  });

  const deleteMutation = trpc.offers.delete.useMutation({
    onSuccess: () => {
      utils.offers.getAll.invalidate();
      utils.offers.getActive.invalidate();
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setTitle("");
    setDescription("");
    setDiscount("");
    setImageUrl("");
    setImagePreview("");
  };

  const startEdit = (offer: { id: number; title: string; description: string; discount: string | null; imageUrl: string | null }) => {
    setEditingId(offer.id);
    setTitle(offer.title);
    setDescription(offer.description);
    setDiscount(offer.discount ?? "");
    setImageUrl(offer.imageUrl ?? "");
    setImagePreview(offer.imageUrl ?? "");
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/upload/offer-image", {
        method: "POST",
        headers: { "x-admin-password": password },
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const { url } = await response.json();
      setImageUrl(url);
    } catch (err) {
      console.error("Upload error:", err);
      setImagePreview("");
      setImageUrl("");
      alert("Error al subir la imagen. Inténtalo de nuevo.");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setImageUrl("");
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({
        password,
        id: editingId,
        title,
        description,
        discount: discount || undefined,
        imageUrl: imageUrl || null,
      });
    } else {
      createMutation.mutate({
        password,
        title,
        description,
        discount: discount || undefined,
        imageUrl: imageUrl || undefined,
      });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      {/* Offer list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : data?.offers && data.offers.length > 0 ? (
        <div className="space-y-3 mb-6">
          {data.offers.map(offer => (
            <div
              key={offer.id}
              className={`border rounded-xl p-4 transition-all ${
                offer.active ? "border-green-300 bg-green-50" : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3 flex-1 min-w-0">
                  {/* Thumbnail */}
                  {offer.imageUrl && (
                    <img
                      src={offer.imageUrl}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-800 truncate">{offer.title}</h4>
                      {offer.active && (
                        <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full font-medium">
                          Activa
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{offer.description}</p>
                    {offer.discount && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-md font-medium">
                        {offer.discount}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleMutation.mutate({ password, id: offer.id, active: !offer.active })}
                    disabled={toggleMutation.isPending}
                    className={`p-2 rounded-lg transition-colors ${
                      offer.active
                        ? "text-green-600 hover:bg-green-100"
                        : "text-gray-400 hover:bg-gray-100"
                    }`}
                    title={offer.active ? "Desactivar oferta" : "Activar oferta"}
                  >
                    {offer.active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => startEdit(offer)}
                    className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-blue-500 transition-colors"
                    title="Editar oferta"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("¿Eliminar esta oferta?")) {
                        deleteMutation.mutate({ password, id: offer.id });
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    title="Eliminar oferta"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400 mb-6">
          <Tag className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay ofertas creadas</p>
        </div>
      )}

      {/* Create/Edit form */}
      {showForm ? (
        <form onSubmit={handleSubmit} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-800">
              {editingId ? "Editar oferta" : "Nueva oferta"}
            </h4>
            <button type="button" onClick={resetForm} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Título *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ej: Oferta Especial Verano"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.72_0.15_60)] focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Descripción *</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ej: Reserva 5 noches y paga solo 4. Válido para junio y julio."
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.72_0.15_60)] focus:border-transparent resize-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Descuento (opcional)</label>
              <input
                type="text"
                value={discount}
                onChange={e => setDiscount(e.target.value)}
                placeholder="Ej: 20% descuento, 1 noche gratis, etc."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.72_0.15_60)] focus:border-transparent"
              />
            </div>

            {/* Image upload */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Imagen (opcional)</label>
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-40 object-cover rounded-lg border border-gray-200"
                  />
                  {uploading && (
                    <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-white" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white rounded-full shadow-sm transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-gray-600" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-28 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors"
                >
                  <ImagePlus className="w-6 h-6" />
                  <span className="text-xs">Haz clic para subir una imagen</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isSaving || uploading || !title || !description}
            className="mt-4 w-full py-2.5 bg-[oklch(0.28_0.07_245)] text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {editingId ? "Guardar cambios" : "Crear oferta"}
          </button>
        </form>
      ) : (
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Crear nueva oferta
        </button>
      )}

      {/* Info note */}
      <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mt-4">
        <p className="text-xs text-amber-700">
          <strong>Nota:</strong> Solo puede haber una oferta activa a la vez. Al activar una, las demás se desactivan automáticamente.
          La oferta activa aparecerá como ventana emergente en la web a los 5 segundos de la visita.
        </p>
      </div>
    </div>
  );
}

/* ── Main Admin Page ── */
export default function Admin() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"calendar" | "offers" | "whatsapp">("calendar");

  const verifyMutation = trpc.calendar.verifyPassword.useMutation({
    onSuccess: () => { setAuthenticated(true); setError(""); },
    onError: (err) => { setError(err.message); },
  });

  const { data, refetch, isLoading } = trpc.calendar.getOccupiedDates.useQuery(undefined, {
    enabled: authenticated,
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    verifyMutation.mutate({ password });
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setPassword("");
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-center w-14 h-14 bg-[oklch(0.28_0.07_245)] rounded-xl mx-auto mb-6">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-center text-gray-800 mb-2">
              Panel de Administración
            </h1>
            <p className="text-sm text-gray-500 text-center mb-6">
              Villa Campito — Gestión del alojamiento
            </p>
            <form onSubmit={handleLogin}>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                placeholder="Contraseña"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.72_0.15_60)] focus:border-transparent mb-4"
                autoFocus
              />
              {error && (
                <p className="text-sm text-red-500 mb-4 text-center">{error}</p>
              )}
              <button
                type="submit"
                disabled={verifyMutation.isPending || !password}
                className="w-full py-3 bg-[oklch(0.28_0.07_245)] text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {verifyMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Acceder
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-[oklch(0.28_0.07_245)]" />
            <h1 className="font-bold text-gray-800">Panel de Administración</h1>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Ver web
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Salir
            </button>
          </div>
        </div>
      </header>

      {/* Tab navigation */}
      <div className="bg-white border-b border-gray-200 px-4">
        <div className="max-w-3xl mx-auto flex gap-1">
          <button
            onClick={() => setActiveTab("calendar")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "calendar"
                ? "border-[oklch(0.28_0.07_245)] text-[oklch(0.28_0.07_245)]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Calendario
            </span>
          </button>
          <button
            onClick={() => setActiveTab("offers")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "offers"
                ? "border-[oklch(0.28_0.07_245)] text-[oklch(0.28_0.07_245)]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="flex items-center gap-2">
              <Tag className="w-4 h-4" /> Ofertas
            </span>
          </button>
          <button
            onClick={() => setActiveTab("whatsapp")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "whatsapp"
                ? "border-green-600 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto p-4 mt-6">
        {activeTab === "calendar" && (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Días ocupados</h2>
                  <p className="text-sm text-gray-500">
                    {data ? `${data.dates.length} día(s) marcados` : "Cargando..."}
                  </p>
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : (
                <AdminCalendar
                  password={password}
                  occupiedDates={data?.dates ?? []}
                  onRefresh={() => refetch()}
                />
              )}
            </div>

            {/* Analytics info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
              <div className="flex items-center gap-3 mb-3">
                <BarChart3 className="w-5 h-5 text-[oklch(0.28_0.07_245)]" />
                <h3 className="font-semibold text-gray-800">Estadísticas de la web</h3>
              </div>
              <p className="text-sm text-gray-500 mb-2">
                Las estadísticas de visitas, páginas vistas y métricas de tu sitio web se muestran en tu panel de <strong className="text-gray-700">Umami Analytics</strong>.
              </p>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mt-3">
                <p className="text-sm text-blue-800">
                  <strong>Cómo acceder:</strong> Entra en tu instancia de Umami con tu usuario y contraseña. Si aún no la has configurado, define las variables de entorno <code>VITE_ANALYTICS_ENDPOINT</code> y <code>VITE_ANALYTICS_WEBSITE_ID</code> al compilar el sitio (ver README).
                </p>
              </div>
            </div>

            {/* Summary of occupied dates */}
            {data && data.dates.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
                <h3 className="font-semibold text-gray-800 mb-3">Resumen de días ocupados</h3>
                <div className="flex flex-wrap gap-2">
                  {data.dates.map(d => (
                    <span key={d} className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded-md font-mono">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "offers" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Gestión de Ofertas</h2>
                <p className="text-sm text-gray-500">
                  Crea y gestiona ofertas que aparecerán como popup en la web
                </p>
              </div>
            </div>
            <OffersManager password={password} />
          </div>
        )}

        {activeTab === "whatsapp" && (
          <WhatsAppPanel password={password} />
        )}
      </main>
    </div>
  );
}
