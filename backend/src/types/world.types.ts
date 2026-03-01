export interface IResourceTemplate {
  key: string;
  type: 'number' | 'text' | 'progress' | 'enum';
  min?: number;
  max?: number;
  defaultValue?: string | number;
  displayFormat?: string; // e.g. "{v} MP" where {v} = value
  options?: string[]; // for 'enum' type
}

export interface ISpecialItemFieldDefinition {
  name: string;
  type: 'text' | 'number' | 'enum';
  options?: string[];
  required?: boolean;
}

export interface ISpecialItemTemplate {
  category: string;
  description: string;
  fields: ISpecialItemFieldDefinition[];
}

export interface IWorld {
  _id: string;
  name: string;
  description: string;
  genre: 'fantasy' | 'sci-fi' | 'wuxia' | 'modern' | 'custom';
  userId: string;
  imageUrl?: string;
  resourceTemplates: IResourceTemplate[];
  specialItemTemplates: ISpecialItemTemplate[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IWorldTemplate {
  id: string;
  name: string;
  description: string;
  genre: IWorld['genre'];
  resourceTemplates: IResourceTemplate[];
  specialItemTemplates?: ISpecialItemTemplate[];
}
