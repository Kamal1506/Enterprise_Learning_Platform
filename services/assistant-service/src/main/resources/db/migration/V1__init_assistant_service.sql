CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create Conversations Table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    title VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create Messages Table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- 'USER', 'ASSISTANT', 'TOOL'
    content TEXT,
    tool_calls_json TEXT, -- Store tool instructions if assistant
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create Tool Audit Logs Table
CREATE TABLE tool_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tool_name VARCHAR(100) NOT NULL,
    endpoint_invoked VARCHAR(500) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    request_payload TEXT,
    response_status INT,
    response_summary TEXT
);

-- Add Index for foreign keys and lookup performance
CREATE INDEX idx_conversations_employee_id ON conversations(employee_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_tool_audit_logs_user_email ON tool_audit_logs(user_email);
