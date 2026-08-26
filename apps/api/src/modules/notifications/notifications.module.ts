import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "../../prisma/prisma.module";
import { PushoverService } from "./pushover.service";

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [PushoverService],
  exports: [PushoverService],
})
export class NotificationsModule {}
