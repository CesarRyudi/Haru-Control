import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OrderStatus } from "@prisma/client";
import axios from "axios";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class PushoverService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PushoverService.name);
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private get apiToken(): string | undefined {
    return (
      this.configService.get<string>("PUSHOVER_API_TOKEN") ||
      process.env.PUSHOVER_API_TOKEN
    );
  }

  private get userKey(): string | undefined {
    return (
      this.configService.get<string>("PUSHOVER_USER_KEY") ||
      process.env.PUSHOVER_USER_KEY
    );
  }

  private get sound(): string {
    return (
      this.configService.get<string>("PUSHOVER_SOUND") ||
      process.env.PUSHOVER_SOUND ||
      "siren"
    );
  }

  onModuleInit() {
    this.logger.log("Inicializando serviço de notificações Pushover...");
    // Iniciar verificação em background a cada 10 segundos
    this.startBackgroundAckCheck();
  }

  onModuleDestroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Envia um alerta de emergência no Pushover (toca alarme em loop até o Acknowledge).
   */
  async sendOrderAlert(order: {
    id: string;
    items?: any[];
    totalPrice: number | any;
    deliveryFee?: number | any;
    address?: string | null;
  }): Promise<string | null> {
    const token = this.apiToken;
    const user = this.userKey;

    if (!token || !user) {
      this.logger.warn(
        "PUSHOVER_API_TOKEN ou PUSHOVER_USER_KEY não configurados no .env. Alerta não enviado.",
      );
      return null;
    }

    try {
      const itemsSummary = (order.items || [])
        .map((item) => {
          const qty = Number(item.quantity);
          const name = item.product?.name || item.productName || "Item";
          return `• ${qty}x ${name}`;
        })
        .join("\n");

      const totalNum =
        Number(order.totalPrice || 0) + Number(order.deliveryFee || 0);
      const totalFormatted = totalNum.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });

      const orderShortId = order.id.slice(0, 8).toUpperCase();
      const messageLines = [
        `🚨 Pedido em Produção!`,
        itemsSummary ? `\nItens:\n${itemsSummary}` : "",
        `\nTotal: ${totalFormatted}`,
        order.address ? `\nEndereço: ${order.address}` : "",
        `\nToque para confirmar o recebimento.`,
      ]
        .filter(Boolean)
        .join("\n");

      this.logger.log(
        `Enviando alerta de emergência Pushover para o pedido #${orderShortId}...`,
      );

      const response = await axios.post(
        "https://api.pushover.net/1/messages.json",
        new URLSearchParams({
          token,
          user,
          title: `🚨 NOVO PEDIDO #${orderShortId}`,
          message: messageLines,
          priority: "2", // Alarme de Emergência
          retry: "30", // Intervalo mínimo de 30 segundos
          expire: "3600", // Expira em 1 hora se não for atendido
          sound: this.sound,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          timeout: 10000,
        },
      );

      const receipt = response.data?.receipt;
      this.logger.log(
        `Alerta Pushover enviado com sucesso para #${orderShortId}. Receipt: ${receipt}`,
      );
      return receipt || null;
    } catch (error: any) {
      this.logger.error(
        `Erro ao enviar alerta Pushover para o pedido ${order.id}: ${
          error.response?.data?.errors?.join(", ") || error.message
        }`,
      );
      return null;
    }
  }

  /**
   * Consulta o status do recibo no Pushover para verificar se foi reconhecido (ACK).
   */
  async checkReceipt(receipt: string): Promise<{
    acknowledged: boolean;
    acknowledgedAt?: Date;
    acknowledgedBy?: string;
  }> {
    const token = this.apiToken;
    if (!token) return { acknowledged: false };

    try {
      const response = await axios.get(
        `https://api.pushover.net/1/receipts/${receipt}.json?token=${token}`,
        { timeout: 5000 },
      );

      const data = response.data;
      if (data && data.acknowledged === 1) {
        return {
          acknowledged: true,
          acknowledgedAt: data.acknowledged_at
            ? new Date(data.acknowledged_at * 1000)
            : new Date(),
          acknowledgedBy: data.acknowledged_by || undefined,
        };
      }

      return { acknowledged: false };
    } catch (error: any) {
      this.logger.error(
        `Erro ao consultar recibo Pushover (${receipt}): ${error.message}`,
      );
      return { acknowledged: false };
    }
  }

  /**
   * Cancela um alerta ativo no Pushover (faz o celular parar de tocar se o pedido for avançado/concluído).
   */
  async cancelAlert(receipt: string): Promise<boolean> {
    const token = this.apiToken;
    if (!token || !receipt) return false;

    try {
      await axios.post(
        `https://api.pushover.net/1/receipts/${receipt}/cancel.json?token=${token}`,
        null,
        { timeout: 5000 },
      );
      this.logger.log(`Alerta Pushover cancelado com sucesso (${receipt}).`);
      return true;
    } catch (error: any) {
      this.logger.warn(
        `Não foi possível cancelar o alerta Pushover (${receipt}): ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Rotina de verificação em background a cada 3 segundos.
   */
  private startBackgroundAckCheck() {
    this.checkInterval = setInterval(async () => {
      try {
        await this.syncPendingAcks();
      } catch (err: any) {
        this.logger.error(
          `Erro na sincronização periódica do Pushover: ${err.message}`,
        );
      }
    }, 3000);
  }

  /**
   * Busca pedidos em produção com recibo pendente e sincroniza com o Pushover.
   */
  async syncPendingAcks() {
    // Buscar pedidos em produção que possuem recibo e ainda não foram confirmados
    const pendingOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING,
        pushoverReceipt: { not: null },
        acknowledgedAt: null,
      },
      select: {
        id: true,
        pushoverReceipt: true,
      },
    });

    if (pendingOrders.length === 0) {
      return;
    }

    for (const order of pendingOrders) {
      if (!order.pushoverReceipt) continue;

      const result = await this.checkReceipt(order.pushoverReceipt);
      if (result.acknowledged && result.acknowledgedAt) {
        await this.prisma.order.update({
          where: { id: order.id },
          data: {
            acknowledgedAt: result.acknowledgedAt,
          },
        });
        this.logger.log(
          `Pedido #${order.id.slice(
            0,
            8,
          )} foi CONFIRMADO (ACK) no Pushover às ${result.acknowledgedAt.toLocaleTimeString()}!`,
        );
      }
    }
  }
}
