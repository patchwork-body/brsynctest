import { EmployeesTable } from '@/components/employees-table';
import { StatsCards } from '@/components/stats-cards';
import { IntegrationsTable } from '@/components/integrations-table';
import { createClient } from '@/lib/supabase';
import { Database } from '../types/supabase';
import { GroupsTable } from '../components/groups-table';

interface EmployeeStats {
  total: number;
  active: number;
  inactive: number;
  terminated: number;
}

interface GroupStats {
  total: number;
}

interface IntegrationStats {
  total: number;
  active: number;
  inactive: number;
  error: number;
  pending_auth: number;
}

export default async function Home() {
  const supabase = await createClient<Database>();

  // Fetch employees with groups data
  const employeesResponse = await supabase
    .from('employee_with_groups')
    .select('*');

  // Fetch groups data
  const groupsResponse = await supabase.from('groups').select('*');
  const groups = groupsResponse.data || [];

  // Fetch integrations data
  const integrationsResponse = await supabase.from('integrations').select('*');
  const integrations = integrationsResponse.data || [];

  const employees = employeesResponse.data || [];
  const employeesError = employeesResponse.error?.message || null;

  // Transform employees data into stats
  const employeeStats: EmployeeStats = {
    total: employees.length,
    active: employees.filter(emp => emp.status === 'active').length,
    inactive: employees.filter(emp => emp.status === 'inactive').length,
    terminated: employees.filter(emp => emp.status === 'terminated').length,
  };

  // Transform groups data into stats
  const groupStats: GroupStats = {
    total: groups.length,
  };

  // Transform integrations data into stats
  const integrationStats: IntegrationStats = {
    total: integrations.length,
    active: integrations.filter(int => int.status === 'active').length,
    inactive: integrations.filter(int => int.status === 'inactive').length,
    error: integrations.filter(int => int.status === 'error').length,
    pending_auth: integrations.filter(int => int.status === 'pending_auth')
      .length,
  };

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='container mx-auto px-4'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            Employee & Group Management
          </h1>
          <p className='text-gray-600'>
            Manage your employees and groups with our modern dashboard
          </p>
        </div>

        <div className='mb-8'>
          <StatsCards
            employeeStats={employeeStats}
            groupStats={groupStats}
            integrationStats={integrationStats}
          />
        </div>

        <div className='mb-8'>
          <IntegrationsTable integrations={integrations} />
        </div>

        <div className='mb-8'>
          <EmployeesTable employees={employees} error={employeesError} />
        </div>

        <div className='mb-8'>
          <GroupsTable groups={groups} />
        </div>
      </div>
    </div>
  );
}
