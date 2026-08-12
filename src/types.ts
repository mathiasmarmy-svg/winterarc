export interface Objective {
  id: string;
  text: string;
  /** Soft-deleted objectives are hidden from the active list but kept so
   * past check-ins referencing their id remain valid and displayable. */
  archived?: boolean;
}

export interface Member {
  id: string;
  name: string;
  city: string;
  checkins: Record<string, string[]>;
  joinedAt: number;
}

export interface ChatMessage {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  at: number;
}

export interface Group {
  code: string;
  name: string;
  createdAt: number;
  /** Member id of whoever founded the cell. Falls back to the earliest
   * joined member for cells created before this field existed. */
  founderId?: string;
  objectives: Objective[];
  members: Member[];
  messages: ChatMessage[];
}

export interface Identity {
  id: string;
  name: string;
  groupCode: string;
}
