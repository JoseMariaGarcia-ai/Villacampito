// client/src/components/admin/WhatsAppPanel.tsx
import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  MessageCircle,
  Wifi,
  WifiOff,
  Loader2,
  Send,
  RefreshCw,
  Bot,
  User,
  Settings,
  ChevronLeft,
  QrCode,
  Megaphone,
} from "lucide-react";
import CampaignsPanel from "./CampaignsPanel";

type Props = { password: string };

export default function WhatsAppPanel({ password }: Props) {
  const [activeTab, setActiveTab] = useState<"chats" | "config" | "campaigns">("chats");
  const [selectedConvId, setSelectedConvId] = useState<number | null>(null);
  const [selectedJid, setSelectedJid] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [promptText, setPromptText] = useState("");
  const [knowledgeText, setKnowledgeText] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Queries ──────────────────────────────────────────────────────────────

  const status = trpc.whatsapp.status.useQuery(
    { password },
    { refetchInterval: 5000 }
  );

  const conversations = trpc.whatsapp.conversations.useQuery(
    { password },
    { refetchInterval: 10000 }
  );

  const messages = trpc.whatsapp.messages.useQuery(
    { password, conversationId: selectedConvId!, limit: 50 },
    { enabled: !!selectedConvId, refetchInterval: 5000 }
  );

  const aiConfig = trpc.whatsapp.getAiConfig.useQuery(
    { password },
    { enabled: activeTab === "config" }
  );

  // ── Sync config editors ──────────────────────────────────────────────────

  useEffect(() => {
    if (aiConfig.data) {
      setPromptText(aiConfig.data.prompt);
      setKnowledgeText(aiConfig.data.knowledge);
    }
  }, [aiConfig.data]);

  // ── Render QR client-side ────────────────────────────────────────────────

  useEffect(() => {
    const qr = status.data?.qr;
    if (!qr) { setQrDataUrl(null); return; }
    import("qrcode").then((mod) => {
      mod.default.toDataURL(qr, { width: 320, margin: 2, errorCorrectionLevel: "M" })
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(null));
    }).catch(() => setQrDataUrl(null));
  }, [status.data?.qr]);

  // ── Auto-scroll messages ─────────────────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.data]);

  // ── Mutations ────────────────────────────────────────────────────────────

  const reconnect = trpc.whatsapp.reconnect.useMutation({
    onSuccess: () => { toast.success("Reconectando..."); status.refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const resetSession = trpc.whatsapp.resetSession.useMutation({
    onSuccess: () => { toast.success("Sesión reseteada, generando nuevo QR..."); status.refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const sendMessage = trpc.whatsapp.sendMessage.useMutation({
    onSuccess: () => {
      setReplyText("");
      messages.refetch();
      conversations.refetch();
      toast.success("Mensaje enviado");
    },
    onError: (e) => toast.error(e.message),
  });

  const markRead = trpc.whatsapp.markRead.useMutation({
    onSuccess: () => conversations.refetch(),
  });

  const setConvAi = trpc.whatsapp.setConversationAi.useMutation({
    onSuccess: () => conversations.refetch(),
  });

  const setGlobalAi = trpc.whatsapp.setGlobalAi.useMutation({
    onSuccess: () => { toast.success("Guardado"); aiConfig.refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const setPrompt = trpc.whatsapp.setPrompt.useMutation({
    onSuccess: () => toast.success("Prompt guardado"),
    onError: (e) => toast.error(e.message),
  });

  const setKnowledge = trpc.whatsapp.setKnowledge.useMutation({
    onSuccess: () => toast.success("Base de conocimientos guardada"),
    onError: (e) => toast.error(e.message),
  });

  // ── Helpers ──────────────────────────────────────────────────────────────

  const handleSelectConversation = (id: number, jid: string) => {
    setSelectedConvId(id);
    setSelectedJid(jid);
    markRead.mutate({ password, conversationId: id });
  };

  const handleSend = () => {
    if (!selectedJid || !replyText.trim()) return;
    sendMessage.mutate({ password, jid: selectedJid, text: replyText.trim() });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectedConv = conversations.data?.find((c) => c.id === selectedConvId);
  const st = status.data?.status ?? "disconnected";

  // ── Status badge ─────────────────────────────────────────────────────────

  const statusBadge = {
    open: <Badge className="bg-green-100 text-green-800 gap-1"><Wifi className="w-3 h-3" />Conectado</Badge>,
    connecting: <Badge className="bg-yellow-100 text-yellow-800 gap-1"><Loader2 className="w-3 h-3 animate-spin" />Conectando</Badge>,
    disconnected: <Badge className="bg-red-100 text-red-800 gap-1"><WifiOff className="w-3 h-3" />Desconectado</Badge>,
  }[st];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-5 h-5 text-green-600" />
          <h2 className="font-semibold text-gray-800">WhatsApp</h2>
          {statusBadge}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("chats")}
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${activeTab === "chats" ? "bg-gray-100 font-medium" : "text-gray-500 hover:bg-gray-50"}`}
          >
            Chats
          </button>
          <button
            onClick={() => setActiveTab("config")}
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${activeTab === "config" ? "bg-gray-100 font-medium" : "text-gray-500 hover:bg-gray-50"}`}
          >
            <Settings className="w-4 h-4 inline mr-1" />IA
          </button>
          <button
            onClick={() => setActiveTab("campaigns")}
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${activeTab === "campaigns" ? "bg-gray-100 font-medium" : "text-gray-500 hover:bg-gray-50"}`}
          >
            <Megaphone className="w-4 h-4 inline mr-1" />Campañas
          </button>
        </div>
      </div>

      {/* QR code section */}
      {st === "connecting" && !status.data?.qr && (
        <div className="flex flex-col items-center gap-3 py-8 bg-yellow-50 border-b border-yellow-100">
          <Loader2 className="w-6 h-6 animate-spin text-yellow-600" />
          <p className="text-sm text-yellow-800 font-medium">Generando código QR…</p>
          <p className="text-xs text-yellow-600">Espera unos segundos</p>
        </div>
      )}

      {status.data?.qr && (
        <div className="flex flex-col items-center gap-3 py-8 bg-yellow-50 border-b border-yellow-100">
          <QrCode className="w-5 h-5 text-yellow-700" />
          <p className="text-sm text-yellow-800 font-medium">Escanea este código con WhatsApp</p>
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Código QR de WhatsApp"
              className="rounded-lg border border-yellow-200 bg-white p-3"
              style={{ width: 320, height: 320 }}
            />
          ) : (
            <div className="w-80 h-80 flex items-center justify-center bg-white rounded-lg border border-yellow-200">
              <Loader2 className="w-6 h-6 animate-spin text-yellow-600" />
            </div>
          )}
          <p className="text-xs text-yellow-600">Abre WhatsApp → Dispositivos vinculados → Vincular dispositivo</p>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => resetSession.mutate({ password })}
            disabled={resetSession.isPending}
            className="text-yellow-700 hover:text-yellow-900"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${resetSession.isPending ? "animate-spin" : ""}`} />
            ¿No conecta tras escanear? Resetear sesión
          </Button>
        </div>
      )}

      {/* Disconnected banner */}
      {st === "disconnected" && !status.data?.qr && (
        <div className="flex items-center justify-between px-6 py-3 bg-red-50 border-b border-red-100">
          <p className="text-sm text-red-700">WhatsApp desconectado</p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => reconnect.mutate({ password })}
              disabled={reconnect.isPending}
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${reconnect.isPending ? "animate-spin" : ""}`} />
              Reconectar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => resetSession.mutate({ password })}
              disabled={resetSession.isPending}
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${resetSession.isPending ? "animate-spin" : ""}`} />
              Resetear sesión
            </Button>
          </div>
        </div>
      )}

      {/* ── CHATS TAB ── */}
      {activeTab === "chats" && (
        <div className="flex h-[600px]">

          {/* Conversation list */}
          <div className={`border-r border-gray-100 flex flex-col ${selectedConvId ? "hidden md:flex w-72" : "flex w-full"}`}>
            <div className="px-4 py-3 border-b border-gray-50">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                {conversations.data?.length ?? 0} conversaciones
              </p>
            </div>
            <ScrollArea className="flex-1">
              {conversations.isLoading && (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              )}
              {conversations.data?.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id, conv.jid)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 ${selectedConvId === conv.id ? "bg-green-50" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 text-green-700 font-semibold text-sm">
                        {(conv.name ?? conv.phone ?? "?")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {conv.name ?? conv.phone ?? conv.jid}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{conv.lastMessagePreview ?? "—"}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {conv.unreadCount > 0 && (
                        <span className="bg-green-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center">
                          {conv.unreadCount}
                        </span>
                      )}
                      {conv.aiEnabled ? (
                        <Bot className="w-3 h-3 text-green-500" />
                      ) : (
                        <Bot className="w-3 h-3 text-gray-300" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
              {conversations.data?.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">Sin conversaciones aún</p>
              )}
            </ScrollArea>
          </div>

          {/* Message view */}
          {selectedConvId && selectedConv ? (
            <div className="flex-1 flex flex-col min-w-0">
              {/* Conv header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50">
                <button onClick={() => setSelectedConvId(null)} className="md:hidden text-gray-500 hover:text-gray-700">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold text-sm">
                  {(selectedConv.name ?? selectedConv.phone ?? "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate">
                    {selectedConv.name ?? selectedConv.phone ?? selectedConv.jid}
                  </p>
                  <p className="text-xs text-gray-400">{selectedConv.phone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">IA</span>
                  <Switch
                    checked={selectedConv.aiEnabled}
                    onCheckedChange={(enabled) =>
                      setConvAi.mutate({ password, conversationId: selectedConv.id, enabled })
                    }
                  />
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 px-4 py-3">
                {messages.isLoading && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  {messages.data?.map((msg) => {
                    const isInbound = msg.role === "inbound";
                    const isAi = msg.role === "outbound_ai";
                    return (
                      <div key={msg.id} className={`flex ${isInbound ? "justify-start" : "justify-end"}`}>
                        <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                          isInbound
                            ? "bg-gray-100 text-gray-800"
                            : isAi
                            ? "bg-green-100 text-green-900"
                            : "bg-green-500 text-white"
                        }`}>
                          {isAi && (
                            <div className="flex items-center gap-1 mb-1 opacity-60">
                              <Bot className="w-3 h-3" />
                              <span className="text-xs">IA</span>
                            </div>
                          )}
                          {!isInbound && !isAi && (
                            <div className="flex items-center gap-1 mb-1 opacity-60">
                              <User className="w-3 h-3" />
                              <span className="text-xs">Manual</span>
                            </div>
                          )}
                          <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                          <p className={`text-xs mt-1 opacity-50 ${isInbound ? "text-right" : ""}`}>
                            {new Date(msg.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Reply input */}
              <div className="border-t border-gray-100 p-3 flex gap-2">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe un mensaje... (Enter para enviar, Shift+Enter nueva línea)"
                  className="flex-1 resize-none min-h-[2.5rem] max-h-32 text-sm"
                  rows={1}
                />
                <Button
                  onClick={handleSend}
                  disabled={!replyText.trim() || sendMessage.isPending || st !== "open"}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 self-end"
                >
                  {sendMessage.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 hidden md:flex items-center justify-center text-gray-400">
              <div className="text-center">
                <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Selecciona una conversación</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CONFIG TAB ── */}
      {activeTab === "config" && (
        <div className="p-6 flex flex-col gap-6">

          {/* Global AI switch */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-800">IA global</p>
              <p className="text-sm text-gray-500">Activa o desactiva Claude para todas las conversaciones</p>
            </div>
            <Switch
              checked={aiConfig.data?.globalEnabled ?? true}
              onCheckedChange={(enabled) => setGlobalAi.mutate({ password, enabled })}
              disabled={setGlobalAi.isPending}
            />
          </div>

          <Separator />

          {/* Prompt */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">Prompt del sistema</p>
                <p className="text-xs text-gray-400 mt-0.5">Instrucciones base para Claude. Se cachea automáticamente en Anthropic.</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPrompt.mutate({ password, prompt: promptText })}
                disabled={setPrompt.isPending}
              >
                {setPrompt.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Guardar"}
              </Button>
            </div>
            <Textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              rows={8}
              className="font-mono text-sm"
              placeholder="Eres el asistente de Villa Campito..."
            />
          </div>

          <Separator />

          {/* Knowledge base */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">Base de conocimientos</p>
                <p className="text-xs text-gray-400 mt-0.5">Información de la villa (precios, normas, FAQs). Se cachea junto con el prompt.</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setKnowledge.mutate({ password, content: knowledgeText })}
                disabled={setKnowledge.isPending}
              >
                {setKnowledge.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Guardar"}
              </Button>
            </div>
            <Textarea
              value={knowledgeText}
              onChange={(e) => setKnowledgeText(e.target.value)}
              rows={12}
              className="font-mono text-sm"
              placeholder="# Villa Campito&#10;## Precios&#10;..."
            />
          </div>
        </div>
      )}

      {/* ── CAMPAIGNS TAB ── */}
      {activeTab === "campaigns" && (
        <CampaignsPanel password={password} />
      )}
    </div>
  );
}
