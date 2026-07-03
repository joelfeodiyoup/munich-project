import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KITA_REPOSITORY } from './ports/kita.repository.interface';
import { KitaRepositoryPrisma } from './adapters/kita.repository.prisma';
import { KitaRepositoryMock } from './adapters/kita.repository.mock';
import { PrismaService } from './prisma.service';

// Choose which repository to use
const USE_MOCK = process.env.USE_MOCK_DATA === 'true';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    {
      provide: KITA_REPOSITORY,
      useClass: USE_MOCK ? KitaRepositoryMock : KitaRepositoryPrisma,
    },
  ],
})
export class AppModule {}
