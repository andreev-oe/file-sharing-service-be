import { PermissionLevel, SubjectType } from '../../common/enums';
import type { PermissionChangeAction } from './permission-changed-on-folder.event';

export interface CascadePermissionsToFoldersEvent {
  action: PermissionChangeAction;
  folderIds: string[];
  subjectType: SubjectType;
  subjectId: string;
  permissionLevel?: PermissionLevel;
}
