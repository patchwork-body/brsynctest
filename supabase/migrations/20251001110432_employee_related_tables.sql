-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE integration_type AS ENUM ('csv', 'microsoft_entra', 'google_workspace');
CREATE TYPE integration_status AS ENUM ('active', 'inactive', 'error', 'pending_auth');
CREATE TYPE employee_status AS ENUM ('active', 'inactive', 'terminated');

-- Create integrations table
CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type integration_type NOT NULL,
    status integration_status NOT NULL DEFAULT 'pending_auth',
    config JSONB, -- Store integration-specific configuration
    auth_data JSONB, -- Store encrypted auth tokens/credentials
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create groups table
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    external_id VARCHAR(255), -- ID from external system (MS Entra, Google, etc.)
    integration_id UUID REFERENCES integrations(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    UNIQUE(external_id, integration_id)
);

-- Create employees table
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    employee_id VARCHAR(255), -- Employee ID from external system
    job_title VARCHAR(255),
    department VARCHAR(255),
    manager_email VARCHAR(255),
    phone VARCHAR(50),
    status employee_status NOT NULL DEFAULT 'active',
    external_id VARCHAR(255), -- ID from external system
    integration_id UUID REFERENCES integrations(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    UNIQUE(email),
    UNIQUE(external_id, integration_id)
);

-- Create employee_groups junction table (many-to-many relationship)
CREATE TABLE employee_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    UNIQUE(employee_id, group_id)
);

-- Create sync_logs table to track sync operations
CREATE TABLE sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
    sync_type VARCHAR(50) NOT NULL, -- 'employees', 'groups', 'full'
    status VARCHAR(20) NOT NULL, -- 'success', 'error', 'partial'
    records_processed INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_external_id ON employees(external_id);
CREATE INDEX idx_employees_integration_id ON employees(integration_id);
CREATE INDEX idx_employees_status ON employees(status);

CREATE INDEX idx_groups_external_id ON groups(external_id);
CREATE INDEX idx_groups_integration_id ON groups(integration_id);

CREATE INDEX idx_employee_groups_employee_id ON employee_groups(employee_id);
CREATE INDEX idx_employee_groups_group_id ON employee_groups(group_id);

CREATE INDEX idx_integrations_type ON integrations(type);
CREATE INDEX idx_integrations_status ON integrations(status);

CREATE INDEX idx_sync_logs_integration_id ON sync_logs(integration_id);
CREATE INDEX idx_sync_logs_started_at ON sync_logs(started_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for integrations
CREATE POLICY "Users can view their own integrations" ON integrations
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create integrations" ON integrations
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own integrations" ON integrations
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own integrations" ON integrations
    FOR DELETE USING (auth.uid() = created_by);

-- RLS policies for groups
CREATE POLICY "Users can view groups from their integrations" ON groups
    FOR SELECT USING (
        integration_id IN (
            SELECT id FROM integrations WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can create groups" ON groups
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update groups from their integrations" ON groups
    FOR UPDATE USING (
        integration_id IN (
            SELECT id FROM integrations WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete groups from their integrations" ON groups
    FOR DELETE USING (
        integration_id IN (
            SELECT id FROM integrations WHERE created_by = auth.uid()
        )
    );

-- RLS policies for employees
CREATE POLICY "Users can view employees from their integrations" ON employees
    FOR SELECT USING (
        integration_id IN (
            SELECT id FROM integrations WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can create employees" ON employees
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update employees from their integrations" ON employees
    FOR UPDATE USING (
        integration_id IN (
            SELECT id FROM integrations WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete employees from their integrations" ON employees
    FOR DELETE USING (
        integration_id IN (
            SELECT id FROM integrations WHERE created_by = auth.uid()
        )
    );

-- RLS policies for employee_groups
CREATE POLICY "Users can view employee groups from their integrations" ON employee_groups
    FOR SELECT USING (
        employee_id IN (
            SELECT id FROM employees WHERE integration_id IN (
                SELECT id FROM integrations WHERE created_by = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage employee groups from their integrations" ON employee_groups
    FOR ALL USING (
        employee_id IN (
            SELECT id FROM employees WHERE integration_id IN (
                SELECT id FROM integrations WHERE created_by = auth.uid()
            )
        )
    );

-- RLS policies for sync_logs
CREATE POLICY "Users can view sync logs from their integrations" ON sync_logs
    FOR SELECT USING (
        integration_id IN (
            SELECT id FROM integrations WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can create sync logs" ON sync_logs
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Create views for easier querying
CREATE VIEW employee_with_groups AS
SELECT
    e.*,
    COALESCE(
        json_agg(
            json_build_object(
                'id', g.id,
                'name', g.name,
                'description', g.description
            )
        ) FILTER (WHERE g.id IS NOT NULL),
        '[]'::json
    ) as groups
FROM employees e
LEFT JOIN employee_groups eg ON e.id = eg.employee_id
LEFT JOIN groups g ON eg.group_id = g.id
GROUP BY e.id;

-- Create function to get integration statistics
CREATE OR REPLACE FUNCTION get_integration_stats(integration_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_employees', COUNT(DISTINCT e.id),
        'active_employees', COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'active'),
        'total_groups', COUNT(DISTINCT g.id),
        'last_sync', i.last_sync_at,
        'sync_status', i.status
    ) INTO result
    FROM integrations i
    LEFT JOIN employees e ON i.id = e.integration_id
    LEFT JOIN groups g ON i.id = g.integration_id
    WHERE i.id = integration_uuid
    GROUP BY i.id, i.last_sync_at, i.status;

    RETURN COALESCE(result, '{}'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to sync employees from external source
CREATE OR REPLACE FUNCTION sync_employees_from_integration(
    integration_uuid UUID,
    employee_data JSONB[]
)
RETURNS JSON AS $$
DECLARE
    processed_count INTEGER := 0;
    created_count INTEGER := 0;
    updated_count INTEGER := 0;
    error_count INTEGER := 0;
    employee_record JSONB;
    existing_employee UUID;
BEGIN
    -- Start sync log
    INSERT INTO sync_logs (integration_id, sync_type, status, started_at)
    VALUES (integration_uuid, 'employees', 'success', NOW());

    -- Process each employee
    FOREACH employee_record IN ARRAY employee_data
    LOOP
        BEGIN
            processed_count := processed_count + 1;

            -- Check if employee exists
            SELECT id INTO existing_employee
            FROM employees
            WHERE external_id = (employee_record->>'external_id')::VARCHAR
            AND integration_id = integration_uuid;

            IF existing_employee IS NOT NULL THEN
                -- Update existing employee
                UPDATE employees SET
                    first_name = COALESCE(employee_record->>'first_name', first_name),
                    last_name = COALESCE(employee_record->>'last_name', last_name),
                    email = COALESCE(employee_record->>'email', email),
                    job_title = COALESCE(employee_record->>'job_title', job_title),
                    department = COALESCE(employee_record->>'department', department),
                    manager_email = COALESCE(employee_record->>'manager_email', manager_email),
                    phone = COALESCE(employee_record->>'phone', phone),
                    status = COALESCE((employee_record->>'status')::employee_status, status),
                    updated_at = NOW()
                WHERE id = existing_employee;

                updated_count := updated_count + 1;
            ELSE
                -- Create new employee
                INSERT INTO employees (
                    first_name, last_name, email, employee_id, job_title,
                    department, manager_email, phone, status, external_id,
                    integration_id
                ) VALUES (
                    employee_record->>'first_name',
                    employee_record->>'last_name',
                    employee_record->>'email',
                    employee_record->>'employee_id',
                    employee_record->>'job_title',
                    employee_record->>'department',
                    employee_record->>'manager_email',
                    employee_record->>'phone',
                    COALESCE((employee_record->>'status')::employee_status, 'active'::employee_status),
                    employee_record->>'external_id',
                    integration_uuid
                );

                created_count := created_count + 1;
            END IF;

        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            -- Log error but continue processing
            RAISE WARNING 'Error processing employee: %', SQLERRM;
        END;
    END LOOP;

    -- Update sync log
    UPDATE sync_logs SET
        records_processed = processed_count,
        records_created = created_count,
        records_updated = updated_count,
        records_failed = error_count,
        status = CASE WHEN error_count > 0 THEN 'partial' ELSE 'success' END,
        completed_at = NOW()
    WHERE integration_id = integration_uuid
    AND sync_type = 'employees'
    AND completed_at IS NULL;

    -- Update integration last sync time - FIX IS HERE
    UPDATE integrations SET
        last_sync_at = NOW(),
        status = CASE
            WHEN error_count > 0 THEN 'error'::integration_status
            ELSE 'active'::integration_status
        END
    WHERE id = integration_uuid;

    RETURN json_build_object(
        'processed', processed_count,
        'created', created_count,
        'updated', updated_count,
        'errors', error_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
