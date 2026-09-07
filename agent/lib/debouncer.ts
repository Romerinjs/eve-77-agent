/**
 * Debouncer / Message Buffer para Canales de Chat (WhatsApp / Kapso)
 * 
 * Acumula ráfagas de mensajes consecutivos (ej. mensajes enviados en un lapso de 5 segundos)
 * de un mismo usuario antes de disparar una sola llamada consolidada al LLM.
 * 
 * Además, previene llamadas concurrentes si el usuario envía mensajes mientras
 * la IA se encuentra generando la respuesta del turno anterior.
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

interface ThreadBuffer {
  items: BufferedItem[];
  timer: NodeJS.Timeout | null;
  resolvers: Array<() => void>;
  firstTimestamp: number;
  latestId: string;
  isProcessing: boolean;
  pendingItems: BufferedItem[];
  pendingResolvers: Array<() => void>;
}

export class MessageDebouncer {
  private bufferMap = new Map<string, ThreadBuffer>();

  private delayMs: number;
  private maxWaitMs: number;

  /**
   * @param delayMs Tiempo de espera en milisegundos tras el último mensaje (default: 5000ms = 5s)
   * @param maxWaitMs Tiempo máximo total antes de forzar flush aunque sigan llegando mensajes (default: 15000ms = 15s)
   */
  constructor(delayMs = 5000, maxWaitMs = 15000) {
    this.delayMs = delayMs;
    this.maxWaitMs = maxWaitMs;
  }

  /**
   * Encola un mensaje entrante. Si ya existe un temporizador activo para el hilo,
   * se cancela y se reinicia el temporizador con el texto acumulado.
   * Retorna una Promesa que se resuelve cuando el lote de mensajes haya sido procesado.
   */
  public enqueue(
    threadId: string,
    item: BufferedItem,
    onFlush: FlushCallback
  ): Promise<void> {
    return new Promise<void>((resolve) => {
      const existing = this.bufferMap.get(threadId);

      if (existing) {
        // Evitar duplicados exactos si el webhook reintenta el mismo messageId
        const isDuplicate =
          existing.items.some((i) => i.messageId === item.messageId) ||
          existing.pendingItems.some((i) => i.messageId === item.messageId);

        if (isDuplicate) {
          console.log(`⚠️ [DEBOUNCER] Mensaje duplicado (${item.messageId}) ignorado para ${threadId}.`);
          resolve();
          return;
        }

        // Si la IA está ocupada procesando el turno anterior, encolar en pendientes para el siguiente turno
        if (existing.isProcessing) {
          console.log(`⏳ [DEBOUNCER] La IA está respondiendo a ${threadId}. Mensaje encolado para el siguiente turno.`);
          existing.pendingItems.push(item);
          existing.pendingResolvers.push(resolve);
          return;
        }

        // Si estamos en la ventana de espera previa al flush, reiniciar temporizador
        if (existing.timer) {
          clearTimeout(existing.timer);
        }
        existing.items.push(item);
        existing.latestId = item.messageId;
        existing.resolvers.push(resolve);

        const timeElapsed = Date.now() - existing.firstTimestamp;
        const nextDelay = (timeElapsed + this.delayMs > this.maxWaitMs)
          ? Math.max(0, this.maxWaitMs - timeElapsed)
          : this.delayMs;

        console.log(`⏳ [DEBOUNCER] Mensaje agregado al buffer de ${threadId} (Total acumulado: ${existing.items.length}). Próximo flush en ${nextDelay / 1000}s...`);

        existing.timer = setTimeout(async () => {
          await this.flush(threadId, onFlush);
        }, nextDelay);
      } else {
        console.log(`⏱️ [DEBOUNCER] Iniciando ventana de buffer para ${threadId} (${this.delayMs / 1000}s de espera tras último mensaje)...`);

        const timer = setTimeout(async () => {
          await this.flush(threadId, onFlush);
        }, this.delayMs);

        this.bufferMap.set(threadId, {
          items: [item],
          timer,
          resolvers: [resolve],
          firstTimestamp: Date.now(),
          latestId: item.messageId,
          isProcessing: false,
          pendingItems: [],
          pendingResolvers: [],
        });
      }
    });
  }

  /**
   * Procesa y vacía el buffer acumulado para un hilo específico.
   */
  private async flush(threadId: string, onFlush: FlushCallback): Promise<void> {
    const entry = this.bufferMap.get(threadId);
    if (!entry || entry.items.length === 0) {
      this.bufferMap.delete(threadId);
      return;
    }

    // Marcar como en procesamiento para que mensajes entrantes durante la llamada no se ejecuten concurrentemente
    entry.isProcessing = true;
    entry.timer = null;

    const itemsToProcess = [...entry.items];
    const resolversToResolve = [...entry.resolvers];

    entry.items = [];
    entry.resolvers = [];

    const aggregatedText = itemsToProcess
      .map((i) => i.text.trim())
      .filter(Boolean)
      .join("\n");

    const allImageUrls: string[] = [];
    for (const item of itemsToProcess) {
      if (item.imageUrls && item.imageUrls.length > 0) {
        allImageUrls.push(...item.imageUrls);
      }
    }

    const lastItem = itemsToProcess[itemsToProcess.length - 1];

    console.log(`🚀 [DEBOUNCER FLUSH] Procesando ráfaga acumulada para ${threadId}: ${itemsToProcess.length} mensaje(s) combinados.`);
    
    try {
      await onFlush(threadId, aggregatedText, allImageUrls, lastItem);
    } catch (error) {
      console.error(`❌ [DEBOUNCER FLUSH] Error ejecutando callback para ${threadId}:`, error);
    } finally {
      // Liberar promesas de los mensajes procesados
      for (const res of resolversToResolve) {
        try {
          res();
        } catch {}
      }

      // Si llegaron nuevos mensajes mientras se procesaba, reencolarlos de inmediato con ventana de debounce
      const currentEntry = this.bufferMap.get(threadId);
      if (currentEntry && currentEntry.pendingItems.length > 0) {
        console.log(`🔄 [DEBOUNCER] Procesando ${currentEntry.pendingItems.length} mensaje(s) que llegaron durante la respuesta anterior.`);
        currentEntry.items = [...currentEntry.pendingItems];
        currentEntry.resolvers = [...currentEntry.pendingResolvers];
        currentEntry.pendingItems = [];
        currentEntry.pendingResolvers = [];
        currentEntry.firstTimestamp = Date.now();
        currentEntry.isProcessing = false;

        currentEntry.timer = setTimeout(async () => {
          await this.flush(threadId, onFlush);
        }, this.delayMs);
      } else {
        this.bufferMap.delete(threadId);
      }
    }
  }

  /**
   * Limpia manualmente el buffer de un hilo si es necesario.
   */
  public cancel(threadId: string): void {
    const existing = this.bufferMap.get(threadId);
    if (existing) {
      if (existing.timer) clearTimeout(existing.timer);
      for (const res of [...existing.resolvers, ...existing.pendingResolvers]) {
        try {
          res();
        } catch {}
      }
      this.bufferMap.delete(threadId);
    }
  }
}

// Instancia singleton compartida con ventana configurada a 5 segundos (máximo 15 segundos)
export const whatsappDebouncer = new MessageDebouncer(5000, 15000);
