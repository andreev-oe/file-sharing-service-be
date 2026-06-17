import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { FoldersModule } from './modules/folders/folders.module';
import { FilesModule } from './modules/files/files.module';
import { NotesModule } from './modules/notes/notes.module';
import { GroupsModule } from './modules/groups/groups.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { ShareLinksModule } from './modules/share-links/share-links.module';
import { ReportsModule } from './modules/reports/reports.module';
import { StorageModule } from './modules/storage/storage.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    FoldersModule,
    FilesModule,
    NotesModule,
    GroupsModule,
    PermissionsModule,
    ShareLinksModule,
    ReportsModule,
    StorageModule,
  ],
})
export class AppModule {}
