export interface Event {
  id: string;
  name: string;
  location: string;
  bannerUrl: string | null;
  teasingTime: string | null; // ISO timestamp, có thể null nếu chưa set
  openTime: string | null; // ISO timestamp, có thể null
  startTime: string | null; // ISO timestamp, có thể null
  endTime: string | null; // ISO timestamp, có thể null
  status: 'DRAFT' | 'TEASING' | 'ONSALE' | 'ENDED' | 'CANCELED';
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string | null;
}

export interface EventCreateDTO {
  name: string;
  location: string;
  bannerUrl?: string | null;
  teasingTime?: string | null;
  openTime?: string | null;
  startTime?: string | null;
  endTime?: string | null;
}

export interface EventUpdateDTO {
  name?: string;
  location?: string;
  bannerUrl?: string | null;
  teasingTime?: string | null;
  openTime?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  status?: string;
}

export interface EventStatusUpdateDTO {
  status: 'DRAFT' | 'TEASING' | 'ONSALE' | 'ENDED' | 'CANCELED';
}