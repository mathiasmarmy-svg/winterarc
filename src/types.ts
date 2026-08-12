export interface Objective {
  id: string;
  text: string;
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
  objectives: Objective[];
  members: Member[];
  messages: ChatMessage[];
}

export interface Identity {
  id: string;
  name: string;
  groupCode: string;
}
