import { z } from 'zod';
import { BaseEntitySchema, UUIDSchema } from './common.js';
import { PersonaSchema } from './persona.js';

// Discussion status
export enum DiscussionStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ARCHIVED = 'archived'
}

// Turn strategy types
export enum TurnStrategy {
  ROUND_ROBIN = 'round_robin',
  MODERATED = 'moderated',
  FREE_FORM = 'free_form',
  CONTEXT_AWARE = 'context_aware',
  PRIORITY_BASED = 'priority_based',
  EXPERTISE_DRIVEN = 'expertise_driven'
}

// Message types
export enum MessageType {
  MESSAGE = 'message',
  QUESTION = 'question',
  ANSWER = 'answer',
  CLARIFICATION = 'clarification',
  OBJECTION = 'objection',
  AGREEMENT = 'agreement',
  SUMMARY = 'summary',
  DECISION = 'decision',
  ACTION_ITEM = 'action_item',
  SYSTEM = 'system'
}

// Participant roles
export enum ParticipantRole {
  PARTICIPANT = 'participant',
  MODERATOR = 'moderator',
  OBSERVER = 'observer',
  FACILITATOR = 'facilitator',
  EXPERT = 'expert'
}

// Discussion visibility
export enum DiscussionVisibility {
  PRIVATE = 'private',
  TEAM = 'team',
  ORGANIZATION = 'organization',
  PUBLIC = 'public'
}

// Message sentiment
export enum MessageSentiment {
  POSITIVE = 'positive',
  NEUTRAL = 'neutral',
  NEGATIVE = 'negative',
  MIXED = 'mixed'
}

// Discussion participant schema
export const DiscussionParticipantSchema = BaseEntitySchema.extend({
  discussionId: UUIDSchema,
  personaId: UUIDSchema,
  agentId: z.string().min(1).max(255),
  userId: UUIDSchema.optional(), // Human user if applicable
  role: z.nativeEnum(ParticipantRole).default(ParticipantRole.PARTICIPANT),
  joinedAt: z.date(),
  lastActiveAt: z.date(),
  messageCount: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
  permissions: z.object({
    canSendMessages: z.boolean().default(true),
    canModerate: z.boolean().default(false),
    canInviteOthers: z.boolean().default(false),
    canEndDiscussion: z.boolean().default(false)
  }).optional(),
  preferences: z.object({
    notificationLevel: z.enum(['all', 'mentions', 'none']).default('all'),
    autoRespond: z.boolean().default(true),
    responseDelay: z.number().min(0).default(0) // seconds
  }).optional(),
  metadata: z.record(z.any()).optional()
});

export type DiscussionParticipant = z.infer<typeof DiscussionParticipantSchema>;

// Message schema
export const DiscussionMessageSchema = BaseEntitySchema.extend({
  discussionId: UUIDSchema,
  participantId: UUIDSchema,
  content: z.string().min(1).max(10000),
  messageType: z.nativeEnum(MessageType).default(MessageType.MESSAGE),
  replyToId: UUIDSchema.optional(),
  threadId: UUIDSchema.optional(),
  sentiment: z.nativeEnum(MessageSentiment).optional(),
  confidence: z.number().min(0).max(1).optional(),
  tokens: z.number().min(0).optional(),
  processingTime: z.number().min(0).optional(), // milliseconds
  attachments: z.array(z.object({
    id: UUIDSchema,
    type: z.enum(['file', 'image', 'link', 'code', 'data']),
    url: z.string().url(),
    name: z.string(),
    size: z.number().min(0).optional(),
    mimeType: z.string().optional()
  })).default([]),
  mentions: z.array(UUIDSchema).default([]), // Mentioned participant IDs
  tags: z.array(z.string()).default([]),
  reactions: z.array(z.object({
    participantId: UUIDSchema,
    emoji: z.string(),
    createdAt: z.date()
  })).default([]),
  editHistory: z.array(z.object({
    content: z.string(),
    editedAt: z.date(),
    reason: z.string().optional()
  })).default([]),
  isEdited: z.boolean().default(false),
  isDeleted: z.boolean().default(false),
  deletedAt: z.date().optional(),
  metadata: z.record(z.any()).optional()
});

export type DiscussionMessage = z.infer<typeof DiscussionMessageSchema>;

// Discussion settings schema
export const DiscussionSettingsSchema = z.object({
  maxParticipants: z.number().min(2).max(50).default(10),
  maxDuration: z.number().min(0).optional(), // minutes
  maxMessages: z.number().min(0).optional(),
  autoModeration: z.boolean().default(true),
  requireApproval: z.boolean().default(false),
  allowInvites: z.boolean().default(true),
  allowFileSharing: z.boolean().default(true),
  allowAnonymous: z.boolean().default(false),
  recordTranscript: z.boolean().default(true),
  enableAnalytics: z.boolean().default(true),
  turnTimeout: z.number().min(0).default(300), // seconds
  responseTimeout: z.number().min(0).default(60), // seconds
  moderationRules: z.array(z.object({
    rule: z.string(),
    action: z.enum(['warn', 'mute', 'remove', 'flag']),
    severity: z.enum(['low', 'medium', 'high'])
  })).default([]),
  customPrompts: z.object({
    welcome: z.string().optional(),
    guidelines: z.string().optional(),
    conclusion: z.string().optional()
  }).optional(),
  integrations: z.object({
    webhooks: z.array(z.object({
      url: z.string().url(),
      events: z.array(z.string()),
      secret: z.string().optional()
    })).default([]),
    externalTools: z.array(z.object({
      name: z.string(),
      type: z.string(),
      config: z.record(z.any())
    })).default([])
  }).optional()
});

export type DiscussionSettings = z.infer<typeof DiscussionSettingsSchema>;

// Discussion state schema
export const DiscussionStateSchema = z.object({
  currentTurn: z.object({
    participantId: UUIDSchema.optional(),
    startedAt: z.date().optional(),
    expectedEndAt: z.date().optional(),
    turnNumber: z.number().min(0).default(0)
  }),
  phase: z.enum(['initialization', 'discussion', 'synthesis', 'conclusion']).default('initialization'),
  messageCount: z.number().min(0).default(0),
  activeParticipants: z.number().min(0).default(0),
  lastActivity: z.date().optional(),
  consensusLevel: z.number().min(0).max(1).default(0),
  engagementScore: z.number().min(0).max(100).default(0),
  topicDrift: z.number().min(0).max(1).default(0),
  keyPoints: z.array(z.object({
    point: z.string(),
    supportingParticipants: z.array(UUIDSchema),
    confidence: z.number().min(0).max(1)
  })).default([]),
  decisions: z.array(z.object({
    decision: z.string(),
    decidedAt: z.date(),
    participants: z.array(UUIDSchema),
    confidence: z.number().min(0).max(1)
  })).default([]),
  actionItems: z.array(z.object({
    item: z.string(),
    assignedTo: UUIDSchema.optional(),
    dueDate: z.date().optional(),
    status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).default('pending')
  })).default([]),
  metrics: z.object({
    averageResponseTime: z.number().min(0).default(0),
    participationBalance: z.number().min(0).max(1).default(0),
    topicCoverage: z.number().min(0).max(1).default(0),
    qualityScore: z.number().min(0).max(100).default(0)
  }).optional()
});

export type DiscussionState = z.infer<typeof DiscussionStateSchema>;

// Turn strategy configuration
export const TurnStrategyConfigSchema = z.object({
  strategy: z.nativeEnum(TurnStrategy),
  config: z.union([
    // Round Robin Config
    z.object({
      type: z.literal('round_robin'),
      skipInactive: z.boolean().default(true),
      maxSkips: z.number().min(0).default(3)
    }),
    // Moderated Config
    z.object({
      type: z.literal('moderated'),
      moderatorId: UUIDSchema,
      requireApproval: z.boolean().default(true),
      autoAdvance: z.boolean().default(false)
    }),
    // Context Aware Config
    z.object({
      type: z.literal('context_aware'),
      relevanceThreshold: z.number().min(0).max(1).default(0.7),
      expertiseWeight: z.number().min(0).max(1).default(0.3),
      engagementWeight: z.number().min(0).max(1).default(0.2)
    }),
    // Priority Based Config
    z.object({
      type: z.literal('priority_based'),
      priorities: z.array(z.object({
        participantId: UUIDSchema,
        priority: z.number().min(0).max(10)
      }))
    }),
    // Free Form Config
    z.object({
      type: z.literal('free_form'),
      cooldownPeriod: z.number().min(0).default(5) // seconds
    }),
    // Expertise Driven Config
    z.object({
      type: z.literal('expertise_driven'),
      topicKeywords: z.array(z.string()),
      expertiseThreshold: z.number().min(0).max(1).default(0.8)
    })
  ])
});

export type TurnStrategyConfig = z.infer<typeof TurnStrategyConfigSchema>;

// Main Discussion schema
export const DiscussionSchema = BaseEntitySchema.extend({
  title: z.string().min(1).max(255),
  topic: z.string().min(1).max(1000),
  description: z.string().max(5000).optional(),
  documentId: UUIDSchema.optional(),
  operationId: UUIDSchema.optional(), // Link to UAIP operation
  participants: z.array(DiscussionParticipantSchema).default([]),
  state: DiscussionStateSchema,
  settings: DiscussionSettingsSchema,
  turnStrategy: TurnStrategyConfigSchema,
  status: z.nativeEnum(DiscussionStatus).default(DiscussionStatus.DRAFT),
  visibility: z.nativeEnum(DiscussionVisibility).default(DiscussionVisibility.PRIVATE),
  createdBy: UUIDSchema,
  organizationId: UUIDSchema.optional(),
  teamId: UUIDSchema.optional(),
  startedAt: z.date().optional(),
  endedAt: z.date().optional(),
  scheduledFor: z.date().optional(),
  estimatedDuration: z.number().min(0).optional(), // minutes
  actualDuration: z.number().min(0).optional(), // minutes
  tags: z.array(z.string()).default([]),
  objectives: z.array(z.string()).default([]),
  outcomes: z.array(z.object({
    outcome: z.string(),
    achievedAt: z.date(),
    confidence: z.number().min(0).max(1)
  })).default([]),
  relatedDiscussions: z.array(UUIDSchema).default([]),
  parentDiscussionId: UUIDSchema.optional(),
  childDiscussions: z.array(UUIDSchema).default([]),
  analytics: z.object({
    totalMessages: z.number().min(0).default(0),
    uniqueParticipants: z.number().min(0).default(0),
    averageMessageLength: z.number().min(0).default(0),
    participationDistribution: z.record(z.number()).optional(),
    sentimentDistribution: z.record(z.number()).optional(),
    topicProgression: z.array(z.object({
      topic: z.string(),
      timestamp: z.date(),
      confidence: z.number().min(0).max(1)
    })).default([])
  }).optional(),
  metadata: z.record(z.any()).optional()
});

export type Discussion = z.infer<typeof DiscussionSchema>;

// Discussion creation request
export const CreateDiscussionRequestSchema = DiscussionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  participants: true,
  state: true,
  analytics: true
}).extend({
  initialParticipants: z.array(z.object({
    personaId: UUIDSchema,
    agentId: z.string(),
    role: z.nativeEnum(ParticipantRole).default(ParticipantRole.PARTICIPANT)
  })).min(2),
  // Make turnStrategy optional with default
  turnStrategy: TurnStrategyConfigSchema.optional().default({
    strategy: TurnStrategy.ROUND_ROBIN,
    config: {
      type: 'round_robin',
      skipInactive: true,
      maxSkips: 3
    }
  }),
  // Make settings optional with default
  settings: DiscussionSettingsSchema.optional().default({
    maxParticipants: 10,
    autoModeration: true,
    requireApproval: false,
    allowInvites: true,
    allowFileSharing: true,
    allowAnonymous: false,
    recordTranscript: true,
    enableAnalytics: true,
    turnTimeout: 300,
    responseTimeout: 60,
    moderationRules: []
  })
});

export type CreateDiscussionRequest = z.infer<typeof CreateDiscussionRequestSchema>;

// Discussion update request
export const UpdateDiscussionRequestSchema = DiscussionSchema.partial().omit({
  id: true,
  createdAt: true,
  createdBy: true
});

export type UpdateDiscussionRequest = z.infer<typeof UpdateDiscussionRequestSchema>;

// Discussion search filters
export const DiscussionSearchFiltersSchema = z.object({
  query: z.string().optional(),
  status: z.array(z.nativeEnum(DiscussionStatus)).optional(),
  visibility: z.array(z.nativeEnum(DiscussionVisibility)).optional(),
  createdBy: z.array(UUIDSchema).optional(),
  organizationId: UUIDSchema.optional(),
  teamId: UUIDSchema.optional(),
  tags: z.array(z.string()).optional(),
  participants: z.array(UUIDSchema).optional(),
  turnStrategy: z.array(z.nativeEnum(TurnStrategy)).optional(),
  hasObjectives: z.boolean().optional(),
  hasOutcomes: z.boolean().optional(),
  minParticipants: z.number().min(0).optional(),
  maxParticipants: z.number().min(0).optional(),
  minDuration: z.number().min(0).optional(),
  maxDuration: z.number().min(0).optional(),
  createdAfter: z.date().optional(),
  createdBefore: z.date().optional(),
  startedAfter: z.date().optional(),
  startedBefore: z.date().optional(),
  endedAfter: z.date().optional(),
  endedBefore: z.date().optional()
});

export type DiscussionSearchFilters = z.infer<typeof DiscussionSearchFiltersSchema>;

// Discussion analytics
export const DiscussionAnalyticsSchema = z.object({
  discussionId: UUIDSchema,
  timeframe: z.object({
    start: z.date(),
    end: z.date()
  }),
  overview: z.object({
    totalMessages: z.number().min(0),
    totalParticipants: z.number().min(0),
    averageMessageLength: z.number().min(0),
    totalDuration: z.number().min(0),
    engagementScore: z.number().min(0).max(100),
    consensusLevel: z.number().min(0).max(1),
    objectivesAchieved: z.number().min(0),
    actionItemsCreated: z.number().min(0)
  }),
  participation: z.object({
    distribution: z.record(z.number()),
    balance: z.number().min(0).max(1),
    dominanceIndex: z.number().min(0).max(1),
    silenceRatio: z.number().min(0).max(1)
  }),
  communication: z.object({
    averageResponseTime: z.number().min(0),
    messageFrequency: z.array(z.object({
      timestamp: z.date(),
      count: z.number()
    })),
    sentimentProgression: z.array(z.object({
      timestamp: z.date(),
      sentiment: z.nativeEnum(MessageSentiment),
      confidence: z.number().min(0).max(1)
    })),
    topicEvolution: z.array(z.object({
      topic: z.string(),
      relevance: z.number().min(0).max(1),
      timespan: z.object({
        start: z.date(),
        end: z.date()
      })
    }))
  }),
  outcomes: z.object({
    decisionsReached: z.number().min(0),
    consensusAchieved: z.boolean(),
    actionItemsGenerated: z.number().min(0),
    keyInsights: z.array(z.string()),
    unresolvedIssues: z.array(z.string())
  }),
  quality: z.object({
    coherenceScore: z.number().min(0).max(100),
    relevanceScore: z.number().min(0).max(100),
    productivityScore: z.number().min(0).max(100),
    satisfactionScore: z.number().min(0).max(5).optional()
  })
});

export type DiscussionAnalytics = z.infer<typeof DiscussionAnalyticsSchema>;

// Discussion summary
export const DiscussionSummarySchema = z.object({
  discussionId: UUIDSchema,
  title: z.string(),
  summary: z.string(),
  keyPoints: z.array(z.string()),
  decisions: z.array(z.string()),
  actionItems: z.array(z.object({
    item: z.string(),
    assignedTo: z.string().optional(),
    dueDate: z.date().optional()
  })),
  participants: z.array(z.object({
    name: z.string(),
    role: z.string(),
    contributionLevel: z.enum(['low', 'medium', 'high'])
  })),
  duration: z.number().min(0),
  messageCount: z.number().min(0),
  consensusLevel: z.number().min(0).max(1),
  nextSteps: z.array(z.string()).optional(),
  generatedAt: z.date(),
  generatedBy: z.enum(['system', 'moderator', 'ai']),
  confidence: z.number().min(0).max(1)
});

export type DiscussionSummary = z.infer<typeof DiscussionSummarySchema>;

// Real-time events
export enum DiscussionEventType {
  PARTICIPANT_JOINED = 'participant_joined',
  PARTICIPANT_LEFT = 'participant_left',
  MESSAGE_SENT = 'message_sent',
  MESSAGE_EDITED = 'message_edited',
  MESSAGE_DELETED = 'message_deleted',
  TURN_CHANGED = 'turn_changed',
  STATUS_CHANGED = 'status_changed',
  SETTINGS_UPDATED = 'settings_updated',
  REACTION_ADDED = 'reaction_added',
  TYPING_STARTED = 'typing_started',
  TYPING_STOPPED = 'typing_stopped'
}

export const DiscussionEventSchema = z.object({
  id: UUIDSchema,
  discussionId: UUIDSchema,
  type: z.nativeEnum(DiscussionEventType),
  participantId: UUIDSchema.optional(),
  data: z.record(z.any()),
  timestamp: z.date(),
  metadata: z.record(z.any()).optional()
});

export type DiscussionEvent = z.infer<typeof DiscussionEventSchema>;

// Export all schemas for validation
export const DiscussionSchemas = {
  DiscussionParticipant: DiscussionParticipantSchema,
  DiscussionMessage: DiscussionMessageSchema,
  DiscussionSettings: DiscussionSettingsSchema,
  DiscussionState: DiscussionStateSchema,
  TurnStrategyConfig: TurnStrategyConfigSchema,
  Discussion: DiscussionSchema,
  CreateDiscussionRequest: CreateDiscussionRequestSchema,
  UpdateDiscussionRequest: UpdateDiscussionRequestSchema,
  DiscussionSearchFilters: DiscussionSearchFiltersSchema,
  DiscussionAnalytics: DiscussionAnalyticsSchema,
  DiscussionSummary: DiscussionSummarySchema,
  DiscussionEvent: DiscussionEventSchema
}; 