export interface IResourceTemplate {
  key: string;
  type: 'number' | 'text' | 'progress' | 'enum';
  min?: number;
  max?: number;
  defaultValue?: string | number;
  displayFormat?: string; // e.g. "{v} MP" where {v} = value
  options?: string[]; // for 'enum' type
}

export interface IWorld {
  _id: string;
  name: string;
  description: string;
  genre: 'fantasy' | 'sci-fi' | 'wuxia' | 'modern' | 'custom';
  userId: string;
  imageUrl?: string;
  resourceTemplates: IResourceTemplate[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IWorldTemplate {
  id: string;
  name: string;
  description: string;
  genre: IWorld['genre'];
  resourceTemplates: IResourceTemplate[];
}
