import type {
  BashInput,
  FileEditInput,
  FileMultiEditInput,
  FileWriteInput,
  GlobInput,
  McpInput,
  WebFetchInput,
  WebSearchInput,
} from '@anthropic-ai/claude-code/sdk-tools';

export enum ToolType {
  Read = 'Read',
  Write = 'Write',
  Edit = 'Edit',
  Bash = 'Bash',
  Grep = 'Grep',
  Glob = 'Glob',
  LS = 'LS',
  MultiEdit = 'MultiEdit',
  NotebookRead = 'NotebookRead',
  NotebookEdit = 'NotebookEdit',
  WebFetch = 'WebFetch',
  TodoRead = 'TodoRead',
  TodoWrite = 'TodoWrite',
  WebSearch = 'WebSearch',
  Task = 'Task',
  MCPTool = 'MCPTool',
}

export const ApprovableTools = [
  ToolType.Write,
  ToolType.Edit,
  ToolType.Bash,
  ToolType.MultiEdit,
  ToolType.Glob,
  ToolType.WebSearch,
  ToolType.WebFetch,
  ToolType.Bash,
  ToolType.MCPTool,
] as const;

type ApprovableTool = (typeof ApprovableTools)[number];

export function isApprovableTool(value: string): value is ApprovableTool {
  return (ApprovableTools as readonly string[]).includes(value);
}

type ApprovableInputs =
  | BashInput
  | FileEditInput
  | FileMultiEditInput
  | FileWriteInput
  | GlobInput
  | WebFetchInput
  | WebSearchInput
  | McpInput;

export type PermissionPayload = {
  toolName: ApprovableTool;
  input: ApprovableInputs;
  requestId: string;
};

export interface TextBlock {
  type: 'text';
  text: string;
}
export interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}
export interface ToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string | Array<TextBlock | unknown>;
  is_error?: boolean;
}
export type ContentBlock = TextBlock | ToolUseBlock | ToolResultBlock;
export interface UserMessage {
  type: 'user';
  content: string;
  session_id?: string;
}
export interface ToolResultMessage {
  type: 'tool_result';
  content: ToolResultBlock[] | string[];
  session_id?: string;
}
export interface HookFeedbackMessage {
  type: 'hook_feedback';
  content: string[];
  session_id?: string;
}
export interface AssistantMessage {
  type: 'assistant';
  content: ContentBlock[];
  session_id?: string;
}
export interface SystemMessage {
  type: 'system';
  subtype?: string;
  data?: unknown;
  session_id?: string;
}
export interface ResultMessage {
  type: 'result';
  subtype?: string;
  content: string;
  session_id?: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
  cost?: {
    input_cost?: number;
    output_cost?: number;
    cache_creation_cost?: number;
    cache_read_cost?: number;
    total_cost?: number;
  };
}
export type Message =
  | UserMessage
  | AssistantMessage
  | SystemMessage
  | ResultMessage
  | ToolResultMessage
  | HookFeedbackMessage;

export interface WebSocket {
  send: (data: string) => void;
  readyState?: number;
  close?: () => void;
}

export interface WebSocketMessage {
  type:
    | 'session-created'
    | 'claude-response'
    | 'claude-error'
    | 'claude-complete'
    | 'claude-output'
    | 'claude-interactive-prompt'
    | 'claude-status'
    | 'session-aborted'
    | 'cursor-system'
    | 'cursor-user'
    | 'cursor-tool-use'
    | 'cursor-error'
    | 'cursor-result'
    | 'cursor-output'
    | 'permission-request';
  sessionId?: string;
  data?: Message | unknown;
  permissionPayload?: PermissionPayload;
  error?: string;
  exitCode?: number;
  isNewSession?: boolean;
  tool?: unknown;
  input?: string; // For cursor-tool-use
}

export const claudeChatType = 'claude-chat';
