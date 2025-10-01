import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

interface StatsCardsProps {
  employeeStats: EmployeeStats;
  groupStats: GroupStats;
  integrationStats: IntegrationStats;
}

export function StatsCards({
  employeeStats,
  groupStats,
  integrationStats,
}: StatsCardsProps) {
  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-6'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Total Employees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{employeeStats.total}</div>
          <p className='text-xs text-muted-foreground'>
            All employees in the system
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>
            Active Employees
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-green-600'>
            {employeeStats.active}
          </div>
          <p className='text-xs text-muted-foreground'>
            Currently active employees
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>
            Inactive Employees
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-yellow-600'>
            {employeeStats.inactive}
          </div>
          <p className='text-xs text-muted-foreground'>
            Temporarily inactive employees
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Total Groups</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{groupStats.total}</div>
          <p className='text-xs text-muted-foreground'>Groups in the system</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Integrations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{integrationStats.total}</div>
          <p className='text-xs text-muted-foreground'>Connected systems</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>
            Active Integrations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-green-600'>
            {integrationStats.active}
          </div>
          <p className='text-xs text-muted-foreground'>Working integrations</p>
        </CardContent>
      </Card>
    </div>
  );
}
