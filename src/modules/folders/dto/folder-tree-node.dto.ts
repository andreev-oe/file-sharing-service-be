import { Folder } from '../entities/folder.entity';

export class FolderTreeNodeDto {
  id: string;
  name: string;
  parentId: string | null;
  path: string;
  createdAt: Date;
  updatedAt: Date;
  children: FolderTreeNodeDto[];

  static fromEntity(folder: Folder, children: FolderTreeNodeDto[]): FolderTreeNodeDto {
    const node = new FolderTreeNodeDto();
    node.id = folder.id;
    node.name = folder.name;
    node.parentId = folder.parentId;
    node.path = folder.path;
    node.createdAt = folder.createdAt;
    node.updatedAt = folder.updatedAt;
    node.children = children;
    return node;
  }
}
