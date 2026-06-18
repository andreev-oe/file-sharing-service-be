import { PermissionLevel, SubjectType } from '../../common/enums';

export type PermissionChangeAction = 'grant' | 'revoke';

export interface PermissionChangedOnFolderEvent {
  action: PermissionChangeAction;
  folderId: string;
  subjectType: SubjectType;
  subjectId: string;
  permissionLevel?: PermissionLevel;
}
