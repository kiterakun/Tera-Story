export interface IResourceTemplate {
  key: string;
  type: 'number' | 'text' | 'progress' | 'enum' | 'pool' | 'object';
  min?: number;
  max?: number;        // for 'pool' type: hard cap; for 'number': range max
  defaultValue?: string | number;
  displayFormat?: string; // e.g. "{v} MP" where {v} = value
  options?: string[]; // for 'enum' type
  children?: IResourceTemplate[]; // for 'object' type — nested sub-property templates
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

export interface IOrganizationTemplate {
  type: string; // e.g. 'guild', 'kingdom', 'cult', 'faction'
  description: string;
  defaultStats: IResourceTemplate[];
}

export interface IWorld {
  _id: string;
  name: string;
  description: string;
  genre: 'fantasy' | 'sci-fi' | 'wuxia' | 'modern' | 'custom';
  userId: string;
  imageUrl?: string;
  resourceTemplates: IResourceTemplate[];
  locationResourceTemplates: IResourceTemplate[];
  organizationTemplates: IOrganizationTemplate[];
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
