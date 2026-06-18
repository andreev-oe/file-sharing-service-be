export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum GroupMemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

export enum PermissionLevel {
  VIEW = 'VIEW',
  COMMENT = 'COMMENT',
  EDIT = 'EDIT',
  MANAGE = 'MANAGE',
}

export enum SubjectType {
  USER = 'user',
  GROUP = 'group',
  EVERYONE = 'everyone',
}

export enum ResourceType {
  FILE = 'file',
  FOLDER = 'folder',
}

export enum ReportType {
  USER = 'user',
  FOLDER = 'folder',
  GROUP = 'group',
}

export enum ReportFormat {
  CSV = 'csv',
  PDF = 'pdf',
}
