import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BlockchainModule } from './blockchain.module';
import { BlockchainService } from './provider/blockchain.service';
import { ProgressModule } from '../progress/progress.module';
import { UsersModule } from '../users/users.module';
import { QuestsModule } from '../quests/quests.module';

const metadataArrayOf = (key: 'imports' | 'providers', target: object) =>
  (Reflect.getMetadata(key, target) as unknown[] | undefined) ?? [];

describe('BlockchainModule wiring', () => {
  it('provides and exports BlockchainService', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot(), BlockchainModule],
    }).compile();

    expect(module.get(BlockchainService, { strict: false })).toBeInstanceOf(
      BlockchainService,
    );
  });

  it('is imported by ProgressModule', () => {
    expect(metadataArrayOf('imports', ProgressModule)).toContain(
      BlockchainModule,
    );
  });

  it('is imported by UsersModule', () => {
    expect(metadataArrayOf('imports', UsersModule)).toContain(BlockchainModule);
  });

  it('is imported by QuestsModule', () => {
    expect(metadataArrayOf('imports', QuestsModule)).toContain(
      BlockchainModule,
    );
  });

  it('does not re-export consumers as service providers', () => {
    // BlockchainService must come through the BlockchainModule import,
    // never be listed directly in a consumer's own providers array.
    for (const consumer of [ProgressModule, UsersModule, QuestsModule]) {
      expect(metadataArrayOf('providers', consumer)).not.toContain(
        BlockchainService,
      );
    }
  });
});
