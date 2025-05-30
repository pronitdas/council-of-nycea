/**
 * UAIP Backend API Client
 * 
 * This file serves as a bridge between the frontend and backend services.
 * It provides typed interfaces and methods for all available API endpoints.
 * 
 * All requests go through the API Gateway which routes to appropriate services:
 * - Agent Intelligence Service (via /api/v1/agents)
 * - Capability Registry Service (via /api/v1/capabilities) 
 * - Orchestration Pipeline Service (via /api/v1/operations)
 */

import { API_ROUTES, buildAPIURL } from '@/config/apiConfig';

// Base configuration
export interface APIConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta: {
    timestamp: Date;
    requestId?: string;
    version?: string;
  };
}

// ============================================================================
// AGENT INTELLIGENCE SERVICE TYPES
// ============================================================================

export interface Agent {
  id: string;
  name: string;
  role: 'assistant' | 'analyzer' | 'orchestrator' | 'specialist';
  persona: {
    name: string;
    description: string;
    capabilities: string[];
    constraints?: Record<string, any>;
    preferences?: Record<string, any>;
  };
  intelligenceConfig: {
    analysisDepth: 'basic' | 'intermediate' | 'advanced';
    contextWindowSize: number;
    decisionThreshold: number;
    learningEnabled: boolean;
    collaborationMode: 'independent' | 'collaborative' | 'supervised';
  };
  securityContext: {
    securityLevel: 'low' | 'medium' | 'high' | 'critical';
    allowedCapabilities: string[];
    restrictedDomains?: string[];
    approvalRequired: boolean;
    auditLevel: 'minimal' | 'standard' | 'comprehensive';
  };
  isActive: boolean;
  createdBy: string;
  lastActiveAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentCreate {
  name: string;
  role: 'assistant' | 'analyzer' | 'orchestrator' | 'specialist';
  persona: Agent['persona'];
  intelligenceConfig?: Partial<Agent['intelligenceConfig']>;
  securityContext?: Partial<Agent['securityContext']>;
  isActive?: boolean;
  createdBy: string;
}

export interface AgentUpdate {
  name?: string;
  role?: Agent['role'];
  persona?: Agent['persona'];
  intelligenceConfig?: Partial<Agent['intelligenceConfig']>;
  securityContext?: Partial<Agent['securityContext']>;
  isActive?: boolean;
  lastActiveAt?: Date;
}

export interface AgentAnalysisRequest {
  conversationContext: {
    id: string;
    agentId: string;
    userId: string;
    messages: Array<{
      id: string;
      role: 'user' | 'assistant' | 'system';
      content: string;
      metadata?: Record<string, any>;
      timestamp: Date;
    }>;
    metadata?: Record<string, any>;
    startedAt: Date;
    lastActivityAt: Date;
  };
  userRequest: string;
  constraints?: Record<string, any>;
}

export interface AgentAnalysisResponse {
  analysis: {
    context: {
      messageCount: number;
      participants: string[];
      topics: string[];
      sentiment: string;
      complexity: string;
      urgency: string;
    };
    intent: {
      primary: string;
      secondary: string[];
      confidence: number;
      entities: any[];
      complexity: string;
    };
    agentCapabilities: {
      tools: string[];
      artifacts: string[];
      specializations: string[];
      limitations: string[];
    };
    environmentFactors: {
      timeOfDay: number;
      userLoad: number;
      systemLoad: string;
      availableResources: string;
    };
  };
  recommendedActions: Array<{
    type: string;
    confidence: number;
    description: string;
    estimatedDuration: number;
  }>;
  confidence: number;
  explanation: string;
  timestamp: Date;
}

export interface AgentPlanRequest {
  analysis: AgentAnalysisResponse['analysis'];
  userPreferences?: Record<string, any>;
  securityContext?: Record<string, any>;
}

export interface AgentPlanResponse {
  operationPlan: {
    id: string;
    type: string;
    agentId: string;
    steps: Array<{
      id: string;
      type: string;
      description: string;
      estimatedDuration: number;
      parameters?: Record<string, any>;
      dependencies?: string[];
    }>;
    dependencies: string[];
    estimatedDuration: number;
    metadata: Record<string, any>;
  };
  estimatedDuration: number;
  riskAssessment: {
    level: 'low' | 'medium' | 'high' | 'critical';
    factors: string[];
    mitigations?: string[];
  };
  approvalRequired: boolean;
  dependencies: string[];
  meta: {
    timestamp: Date;
    processingTime: number;
    agentId: string;
    version: string;
  };
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  uptime: number;
  version: string;
  environment: string;
  memory: {
    used: number;
    total: number;
    external: number;
  };
}

// ============================================================================
// CAPABILITY REGISTRY SERVICE TYPES
// ============================================================================

export interface Capability {
  id: string;
  name: string;
  description: string;
  type: 'tool' | 'artifact' | 'hybrid';
  status: 'active' | 'deprecated' | 'disabled' | 'experimental';
  metadata: {
    version: string;
    author?: string;
    license?: string;
    documentation?: string;
    examples?: Record<string, any>[];
    tags: string[];
    category: string;
    subcategory?: string;
    trustScore: number;
    usageCount: number;
    lastUsed?: Date;
    performance?: {
      averageLatency?: number;
      successRate?: number;
      errorRate?: number;
    };
  };
  toolConfig?: {
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    authentication: {
      type: 'none' | 'api_key' | 'oauth' | 'jwt' | 'basic';
      config?: Record<string, any>;
    };
    parameters: Array<{
      name: string;
      type: 'string' | 'number' | 'boolean' | 'array' | 'object';
      required: boolean;
      description?: string;
      validation?: Record<string, any>;
    }>;
    responseSchema?: Record<string, any>;
    timeout: number;
    retryPolicy?: {
      maxRetries: number;
      backoffStrategy: 'fixed' | 'exponential';
    };
  };
  artifactConfig?: {
    templateEngine: 'handlebars' | 'mustache' | 'jinja2' | 'ejs';
    template: string;
    outputFormat: 'text' | 'json' | 'yaml' | 'xml' | 'html' | 'markdown' | 'code';
    variables: Array<{
      name: string;
      type: 'string' | 'number' | 'boolean' | 'array' | 'object';
      required: boolean;
      description?: string;
      defaultValue?: any;
    }>;
    validationRules?: Array<{
      field: string;
      rule: string;
      message: string;
    }>;
    postProcessing?: Array<{
      type: 'format' | 'validate' | 'transform';
      config: Record<string, any>;
    }>;
  };
  dependencies?: string[];
  securityRequirements: {
    minimumSecurityLevel: 'low' | 'medium' | 'high' | 'critical';
    requiredPermissions: string[];
    sensitiveData: boolean;
    auditRequired: boolean;
  };
  resourceRequirements?: {
    cpu?: number;
    memory?: number;
    storage?: number;
    network: boolean;
    estimatedDuration?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CapabilitySearchRequest {
  query?: string;
  type?: 'tool' | 'artifact' | 'hybrid';
  category?: string;
  tags?: string[];
  securityLevel?: 'low' | 'medium' | 'high' | 'critical';
  includeDeprecated?: boolean;
  sortBy?: 'relevance' | 'name' | 'usage_count' | 'trust_score' | 'created_at';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface CapabilitySearchResponse {
  capabilities: Capability[];
  totalCount: number;
  recommendations: string[];
  searchTime: number;
}

export interface CapabilityRecommendation {
  capability: Capability;
  relevanceScore: number;
  reasoning: string;
  alternatives?: string[];
  usageExamples?: Record<string, any>[];
}

// ============================================================================
// ORCHESTRATION PIPELINE SERVICE TYPES
// ============================================================================

export interface Operation {
  id: string;
  type: 'tool_execution' | 'artifact_generation' | 'hybrid_workflow' | 'analysis';
  agentId: string;
  userId: string;
  name: string;
  description: string;
  status: 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'suspended' | 'paused' | 'compensating';
  context: {
    executionContext: {
      agentId: string;
      userId: string;
      conversationId?: string;
      sessionId?: string;
      environment: 'development' | 'staging' | 'production';
      metadata?: Record<string, any>;
      timeout: number;
      resourceLimits: {
        maxMemory: number;
        maxCpu: number;
        maxDuration: number;
      };
    };
  };
  executionPlan: {
    id: string;
    type: string;
    agentId: string;
    steps: Array<{
      id: string;
      type: string;
      description: string;
      estimatedDuration: number;
      parameters?: Record<string, any>;
      dependencies?: string[];
    }>;
    dependencies: string[];
    estimatedDuration: number;
    metadata: Record<string, any>;
  };
  metadata: {
    priority: 'low' | 'medium' | 'high' | 'urgent';
    tags: string[];
    estimatedDuration: number;
    resourceRequirements: {
      cpu?: number;
      memory?: number;
      storage?: number;
      network: boolean;
      gpu: boolean;
      estimatedDuration?: number;
    };
  };
  estimatedDuration: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OperationStatusResponse {
  operation: Operation;
  status: Operation['status'];
  progress: {
    currentStep?: string;
    completedSteps: number;
    totalSteps: number;
    percentage: number;
  };
  metrics: {
    startTime: Date;
    endTime?: Date;
    duration?: number;
    resourceUsage: {
      cpu: number;
      memory: number;
      storage: number;
    };
    stepMetrics: Array<{
      stepId: string;
      startTime: Date;
      endTime?: Date;
      duration?: number;
      status: string;
      retryCount: number;
    }>;
  };
  errors: Array<{
    stepId?: string;
    errorType: string;
    message: string;
    timestamp: Date;
    retryable: boolean;
    context?: Record<string, any>;
  }>;
}

export interface ExecuteOperationRequest {
  operation: Omit<Operation, 'id' | 'status' | 'createdAt' | 'updatedAt'>;
  options?: {
    priority?: 'low' | 'normal' | 'high' | 'critical';
    async?: boolean;
    webhookUrl?: string;
    tags?: string[];
  };
}

export interface PauseOperationRequest {
  reason: string;
}

export interface ResumeOperationRequest {
  checkpointId?: string;
}

export interface CancelOperationRequest {
  reason: string;
  compensate?: boolean;
  force?: boolean;
}

// ============================================================================
// API CLIENT CLASS
// ============================================================================

export class UAIPAPIClient {
  private config: APIConfig;

  constructor(config: APIConfig = {}) {
    this.config = {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      ...config,
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const url = `${this.config.baseURL || ''}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.config.headers,
        ...options.headers,
      },
      signal: AbortSignal.timeout(this.config.timeout || 30000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // ============================================================================
  // AGENT INTELLIGENCE SERVICE METHODS
  // ============================================================================

  /**
   * Agent Intelligence Service API methods
   */
  agents = {
    /**
     * Create a new agent
     */
    create: async (agentData: AgentCreate): Promise<APIResponse<Agent>> => {
      return this.request<Agent>(buildAPIURL(API_ROUTES.AGENTS), {
        method: 'POST',
        body: JSON.stringify(agentData),
      });
    },

    /**
     * Get agent by ID
     */
    get: async (agentId: string): Promise<APIResponse<Agent>> => {
      return this.request<Agent>(buildAPIURL(`${API_ROUTES.AGENTS}/${agentId}`));
    },

    /**
     * Update agent
     */
    update: async (agentId: string, updates: AgentUpdate): Promise<APIResponse<Agent>> => {
      return this.request<Agent>(buildAPIURL(`${API_ROUTES.AGENTS}/${agentId}`), {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },

    /**
     * Delete agent
     */
    delete: async (agentId: string): Promise<APIResponse<void>> => {
      return this.request<void>(buildAPIURL(`${API_ROUTES.AGENTS}/${agentId}`), {
        method: 'DELETE',
      });
    },

    /**
     * Analyze conversation context
     */
    analyze: async (agentId: string, analysisRequest: AgentAnalysisRequest): Promise<APIResponse<AgentAnalysisResponse>> => {
      return this.request<AgentAnalysisResponse>(buildAPIURL(`${API_ROUTES.AGENTS}/${agentId}/analyze`), {
        method: 'POST',
        body: JSON.stringify(analysisRequest),
      });
    },

    /**
     * Generate operation plan
     */
    plan: async (agentId: string, planRequest: AgentPlanRequest): Promise<APIResponse<AgentPlanResponse>> => {
      return this.request<AgentPlanResponse>(buildAPIURL(`${API_ROUTES.AGENTS}/${agentId}/plan`), {
        method: 'POST',
        body: JSON.stringify(planRequest),
      });
    },

    /**
     * Get agent capabilities
     */
    getCapabilities: async (agentId: string): Promise<APIResponse<string[]>> => {
      return this.request<string[]>(buildAPIURL(`${API_ROUTES.AGENTS}/${agentId}/capabilities`));
    },

    /**
     * Agent learning endpoint
     */
    learn: async (agentId: string, learningData: Record<string, any>): Promise<APIResponse<void>> => {
      return this.request<void>(buildAPIURL(`${API_ROUTES.AGENTS}/${agentId}/learn`), {
        method: 'POST',
        body: JSON.stringify(learningData),
      });
    },

    /**
     * Health check endpoints
     */
    health: {
      basic: async (): Promise<APIResponse<HealthStatus>> => {
        return this.request<HealthStatus>(buildAPIURL(API_ROUTES.HEALTH));
      },
      detailed: async (): Promise<APIResponse<HealthStatus & { dependencies: Record<string, any> }>> => {
        return this.request<HealthStatus & { dependencies: Record<string, any> }>>(buildAPIURL(`${API_ROUTES.HEALTH}/detailed`));
      },
      ready: async (): Promise<APIResponse<{ ready: boolean }>> => {
        return this.request<{ ready: boolean }>(buildAPIURL(`${API_ROUTES.HEALTH}/ready`));
      },
      live: async (): Promise<APIResponse<{ alive: boolean }>> => {
        return this.request<{ alive: boolean }>(buildAPIURL(`${API_ROUTES.HEALTH}/live`));
      },
      metrics: async (): Promise<APIResponse<Record<string, any>>> => {
        return this.request<Record<string, any>>(buildAPIURL(`${API_ROUTES.HEALTH}/metrics`));
      },
    },
  };

  // ============================================================================
  // CAPABILITY REGISTRY SERVICE METHODS
  // ============================================================================

  /**
   * Capability Registry Service API methods
   */
  capabilities = {
    /**
     * Search capabilities
     */
    search: async (searchParams: CapabilitySearchRequest): Promise<APIResponse<CapabilitySearchResponse>> => {
      const params = new URLSearchParams();
      
      if (searchParams.query) params.append('query', searchParams.query);
      if (searchParams.type) params.append('type', searchParams.type);
      if (searchParams.category) params.append('category', searchParams.category);
      if (searchParams.tags) params.append('tags', searchParams.tags.join(','));
      if (searchParams.securityLevel) params.append('securityLevel', searchParams.securityLevel);
      if (searchParams.includeDeprecated) params.append('includeDeprecated', searchParams.includeDeprecated.toString());
      if (searchParams.sortBy) params.append('sortBy', searchParams.sortBy);
      if (searchParams.sortOrder) params.append('sortOrder', searchParams.sortOrder);
      if (searchParams.limit) params.append('limit', searchParams.limit.toString());
      if (searchParams.offset) params.append('offset', searchParams.offset.toString());
      
      return this.request<CapabilitySearchResponse>(buildAPIURL(`${API_ROUTES.CAPABILITIES}/search?${params}`));
    },

    /**
     * Get capability categories
     */
    getCategories: async (): Promise<APIResponse<string[]>> => {
      return this.request<string[]>(buildAPIURL(`${API_ROUTES.CAPABILITIES}/categories`));
    },

    /**
     * Get capability recommendations
     */
    getRecommendations: async (context?: Record<string, any>): Promise<APIResponse<CapabilityRecommendation[]>> => {
      const params = context ? `?${new URLSearchParams(context)}` : '';
      return this.request<CapabilityRecommendation[]>(buildAPIURL(`${API_ROUTES.CAPABILITIES}/recommendations${params}`));
    },

    /**
     * Register new capability
     */
    register: async (capability: Omit<Capability, 'id' | 'createdAt' | 'updatedAt'>): Promise<APIResponse<Capability>> => {
      return this.request<Capability>(buildAPIURL(`${API_ROUTES.CAPABILITIES}/register`), {
        method: 'POST',
        body: JSON.stringify(capability),
      });
    },

    /**
     * Get capability by ID
     */
    get: async (capabilityId: string): Promise<APIResponse<Capability>> => {
      return this.request<Capability>(buildAPIURL(`${API_ROUTES.CAPABILITIES}/${capabilityId}`));
    },

    /**
     * Update capability
     */
    update: async (capabilityId: string, updates: Partial<Capability>): Promise<APIResponse<Capability>> => {
      return this.request<Capability>(buildAPIURL(`${API_ROUTES.CAPABILITIES}/${capabilityId}`), {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },

    /**
     * Delete capability
     */
    delete: async (capabilityId: string): Promise<APIResponse<void>> => {
      return this.request<void>(buildAPIURL(`${API_ROUTES.CAPABILITIES}/${capabilityId}`), {
        method: 'DELETE',
      });
    },

    /**
     * Get capability dependencies
     */
    getDependencies: async (capabilityId: string): Promise<APIResponse<string[]>> => {
      return this.request<string[]>(buildAPIURL(`${API_ROUTES.CAPABILITIES}/${capabilityId}/dependencies`));
    },

    /**
     * Validate capability
     */
    validate: async (capabilityId: string, validationData?: Record<string, any>): Promise<APIResponse<{ valid: boolean; errors?: string[] }>> => {
      return this.request<{ valid: boolean; errors?: string[] }>(buildAPIURL(`${API_ROUTES.CAPABILITIES}/${capabilityId}/validate`), {
        method: 'POST',
        body: JSON.stringify(validationData || {}),
      });
    },

    /**
     * Health check endpoints
     */
    health: {
      basic: async (): Promise<APIResponse<HealthStatus>> => {
        return this.request<HealthStatus>(buildAPIURL(API_ROUTES.HEALTH));
      },
      detailed: async (): Promise<APIResponse<HealthStatus & { dependencies: Record<string, any> }>> => {
        return this.request<HealthStatus & { dependencies: Record<string, any> }>>(buildAPIURL(`${API_ROUTES.HEALTH}/detailed`));
      },
      ready: async (): Promise<APIResponse<{ ready: boolean }>> => {
        return this.request<{ ready: boolean }>(buildAPIURL(`${API_ROUTES.HEALTH}/ready`));
      },
      live: async (): Promise<APIResponse<{ alive: boolean }>> => {
        return this.request<{ alive: boolean }>(buildAPIURL(`${API_ROUTES.HEALTH}/live`));
      },
    },
  };

  // ============================================================================
  // ORCHESTRATION PIPELINE SERVICE METHODS
  // ============================================================================

  /**
   * Orchestration Pipeline Service API methods
   */
  orchestration = {
    /**
     * Execute operation
     */
    execute: async (operationRequest: ExecuteOperationRequest): Promise<APIResponse<{ workflowInstanceId: string }>> => {
      return this.request<{ workflowInstanceId: string }>(buildAPIURL(API_ROUTES.OPERATIONS), {
        method: 'POST',
        body: JSON.stringify(operationRequest),
      });
    },

    /**
     * Get operation status
     */
    getStatus: async (operationId: string): Promise<APIResponse<OperationStatusResponse>> => {
      return this.request<OperationStatusResponse>(buildAPIURL(`${API_ROUTES.OPERATIONS}/${operationId}/status`));
    },

    /**
     * Pause operation
     */
    pause: async (operationId: string, pauseRequest: PauseOperationRequest): Promise<APIResponse<{ message: string }>> => {
      return this.request<{ message: string }>(buildAPIURL(`${API_ROUTES.OPERATIONS}/${operationId}/pause`), {
        method: 'POST',
        body: JSON.stringify(pauseRequest),
      });
    },

    /**
     * Resume operation
     */
    resume: async (operationId: string, resumeRequest: ResumeOperationRequest): Promise<APIResponse<{ message: string }>> => {
      return this.request<{ message: string }>(buildAPIURL(`${API_ROUTES.OPERATIONS}/${operationId}/resume`), {
        method: 'POST',
        body: JSON.stringify(resumeRequest),
      });
    },

    /**
     * Cancel operation
     */
    cancel: async (operationId: string, cancelRequest: CancelOperationRequest): Promise<APIResponse<{ message: string }>> => {
      return this.request<{ message: string }>(buildAPIURL(`${API_ROUTES.OPERATIONS}/${operationId}/cancel`), {
        method: 'POST',
        body: JSON.stringify(cancelRequest),
      });
    },

    /**
     * Health check
     */
    health: async (): Promise<APIResponse<HealthStatus>> => {
      return this.request<HealthStatus>(buildAPIURL(API_ROUTES.HEALTH));
    },
  };
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Create a pre-configured API client instance
 */
export function createAPIClient(config?: APIConfig): UAIPAPIClient {
  return new UAIPAPIClient(config);
}

/**
 * Default API client instance
 */
export const apiClient = createAPIClient();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if API response indicates success
 */
export function isSuccessResponse<T>(response: APIResponse<T>): response is APIResponse<T> & { success: true; data: T } {
  return response.success === true && response.data !== undefined;
}

/**
 * Extract error message from API response
 */
export function getErrorMessage(response: APIResponse): string {
  return response.error?.message || 'Unknown error occurred';
}

/**
 * Extract error code from API response
 */
export function getErrorCode(response: APIResponse): string {
  return response.error?.code || 'UNKNOWN_ERROR';
}

/**
 * Type guard for checking if response has error
 */
export function hasError(response: APIResponse): response is APIResponse & { success: false; error: NonNullable<APIResponse['error']> } {
  return response.success === false && response.error !== undefined;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default UAIPAPIClient; 