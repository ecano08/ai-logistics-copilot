CREATE TABLE IF NOT EXISTS knowledge_documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    category VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    source_path TEXT NOT NULL,
    extracted_text TEXT,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT knowledge_documents_status_check
        CHECK (status IN ('pending', 'processing', 'ready', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_knowledge_documents_status
    ON knowledge_documents(status);

CREATE INDEX IF NOT EXISTS idx_knowledge_documents_category
    ON knowledge_documents(category);