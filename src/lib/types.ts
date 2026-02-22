export interface Agent {
  id: string;
  name: string;
  sector: string;
  tone: "formel" | "friendly" | "direct";
  instructions: string;
  enabled: boolean;
  lastRun: string | null;
  channels: {
    whatsapp: { enabled: boolean; number?: string };
    email: { enabled: boolean; address?: string };
    telegram: { enabled: boolean; token?: string };
    imessage: { enabled: boolean; premium: true };
  };
  skills: {
    emails: boolean;
    calendar: boolean;
    prospection: boolean;
    crm: boolean;
    reminders: boolean;
  };
  activity: ActivityLog[];
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
}

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  sector: string;
  tone: "formel" | "friendly" | "direct";
  defaultSkills: Agent["skills"];
  defaultChannels: Partial<Agent["channels"]>;
}
