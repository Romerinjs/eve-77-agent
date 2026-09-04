/**
 * Debouncer / Message Buffer para Canales de Chat (WhatsApp / Kapso)
 * 
 * Acumula ráfagas de mensajes consecutivos (ej. 1 a 4 mensajes en pocos segundos)
 * de un mismo usuario antes de disparar una sola llamada consolidada al LLM.
 */

export interface BufferedItem {
  text: string;
  imageUrls?: string[];
  messageId: string;
  senderName?: string;
  timestamp: number;
}

export type FlushCallback = (
  threadId: string,
  aggregatedText: string,
  imageUrls: string[],
  lastItem: BufferedItem
) => Promise<void>;

export class MessageDebouncer {
  private bufferMap = new Map<string, {
    items: BufferedItem[];
    timer: NodeJS.Timeout;
    latestId: string;
  }>();

  private delayMs: number;

  /**
   * @param delayMs Tiempo de espera en milisegundos tras el último mensaje (default: 10000ms = 10s)
   */
  constructor(delayMs = 10_000) {
    this.delayMs = delayMs;
  }

  /**
   * Encola un mensaje entrante. Si ya existe un temporizador activo para el hilo,
   * se cancela y se reinicia el temporizador de 10s con el texto acumulado.
   */
  public enqueue(
    threadId: string,
    item: BufferedItem,
    onFlush: FlushCallback
  ): void {
    const existing = this.bufferMap.get(threadId);

    if (existing) {
      // Cancelar temporizador previo
      clearTimeout(existing.timer);
      existing.items.push(item);
      existing.latestId = item.messageId;

      console.log(`⏳ [DEBOUNCER] Mensaje agregado al buffer de ${threadId} (Total: ${existing.items.length}). Reiniciando timer a ${this.delayMs / 1000}s...`);

      existing.timer = setTimeout(async () => {
        await this.flush(threadId, onFlush);
      }, this.delayMs);
    } else {
      console.log(`⏱️ [DEBOUNCER] Iniciando buffer para nuevo mensaje de ${threadId} (${this.delayMs / 1000}s de espera)...`);

      const timer = setTimeout(async () => {
        await this.flush(threadId, onFlush);
      }, this.delayMs);

      this.bufferMap.set(threadId, {
        items: [item],
        timer,
        latestId: item.messageId,
      });
    }
  }

  /**
   * Procesa y vacía el buffer acumulado para un hilo específico.
   */
  private async flush(threadId: string, onFlush: FlushCallback): Promise<void> {
    const entry = this.bufferMap.get(threadId);
    if (!entry || entry.items.length === 0) return;

    // Eliminar del mapa antes de procesar para evitar carreras
    this.bufferMap.delete(threadId);

    const aggregatedText = entry.items
      .map((i) => i.text.trim())
      .filter(Boolean)
      .join("\n");

    const allImageUrls: string[] = [];
    for (const item of entry.items) {
      if (item.imageUrls && item.imageUrls.length > 0) {
        allImageUrls.push(...item.imageUrls);
      }
    }

    const lastItem = entry.items[entry.items.length - 1];

    console.log(`🚀 [DEBOUNCER FLUSH] Procesando ráfaga acumulada para ${threadId}: ${entry.items.length} mensaje(s) combinados.`);
    
    try {
      await onFlush(threadId, aggregatedText, allImageUrls, lastItem);
    } catch (error) {
      console.error(`❌ [DEBOUNCER FLUSH] Error ejecutando callback para ${threadId}:`, error);
    }
  }

  /**
   * Limpia manualmente el buffer de un hilo si es necesario.
   */
  public cancel(threadId: string): void {
    const existing = this.bufferMap.get(threadId);
    if (existing) {
      clearTimeout(existing.timer);
      this.bufferMap.delete(threadId);
    }
  }
}

// Instancia singleton compartida con ventana de 10 segundos
export const whatsappDebouncer = new MessageDebouncer(10_000);
