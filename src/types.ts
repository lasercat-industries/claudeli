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
import type { PermissionResult, Options } from '@anthropic-ai/claude-code';

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

export function isBashInput(value: unknown): value is BashInput {
  return (
    typeof value === 'object' && value !== null && typeof (value as BashInput).command === 'string'
  );
}

// FileEditInput
export function isFileEditInput(value: unknown): value is FileEditInput {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as FileEditInput).file_path === 'string' &&
    typeof (value as FileEditInput).old_string === 'string' &&
    typeof (value as FileEditInput).new_string === 'string'
  );
}

export interface FileEditOperation {
  /**
   * The text to replace
   */
  old_string: string;
  /**
   * The text to replace it with
   */
  new_string: string;
  /**
   * Replace all occurrences of old_string (default false).
   */
  replace_all?: boolean;
}

// FileMultiEditInput
export function isFileMultiEditInput(value: unknown): value is FileMultiEditInput {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as FileMultiEditInput).file_path === 'string' &&
    Array.isArray((value as FileMultiEditInput).edits) &&
    (value as FileMultiEditInput).edits.length > 0 &&
    (value as FileMultiEditInput).edits.every(
      (edit: FileEditOperation) =>
        typeof edit.old_string === 'string' && typeof edit.new_string === 'string',
    )
  );
}

// FileWriteInput
export function isFileWriteInput(value: unknown): value is FileWriteInput {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as FileWriteInput).file_path === 'string' &&
    typeof (value as FileWriteInput).content === 'string'
  );
}

// GlobInput
export function isGlobInput(value: unknown): value is GlobInput {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as GlobInput).pattern === 'string' &&
    ((value as GlobInput).path === undefined || typeof (value as GlobInput).path === 'string')
  );
}

// WebFetchInput
export function isWebFetchInput(value: unknown): value is WebFetchInput {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as WebFetchInput).url === 'string' &&
    typeof (value as WebFetchInput).prompt === 'string'
  );
}

// WebSearchInput
export function isWebSearchInput(value: unknown): value is WebSearchInput {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as WebSearchInput).query === 'string' &&
    ((value as WebSearchInput).allowed_domains === undefined ||
      Array.isArray((value as WebSearchInput).allowed_domains)) &&
    ((value as WebSearchInput).blocked_domains === undefined ||
      Array.isArray((value as WebSearchInput).blocked_domains))
  );
}

// McpInput (catch-all, since it’s just Record<string, unknown>)
export function isMcpInput(value: unknown): value is McpInput {
  return typeof value === 'object' && value !== null;
}

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

export type ClaudeCommandMessage = {
  type: 'claude-command';
  command: string;
  options: Options;
};

export type ClaudePermissionMessage = {
  type: 'permissions-response';
  sessionId: string;
  requestId: string;
  result: PermissionResult;
};

export type AbortSessionMessage = {
  type: 'abort-session';
  sessionId: string;
  provider: string;
};

export type OutgoingMessage = ClaudeCommandMessage | AbortSessionMessage | ClaudePermissionMessage;

export const claudeChatType = 'claude-chat';
