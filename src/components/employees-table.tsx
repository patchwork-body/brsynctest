'use client';

import { useState, useMemo } from 'react';
import { Tables } from '@/types/supabase';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AddEmployeeDialog } from './add-employee-dialog';

const statusColors = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-yellow-100 text-yellow-800',
  terminated: 'bg-red-100 text-red-800',
};

type EmployeeWithGroups = Tables<'employee_with_groups'>;

interface EmployeesTableProps {
  employees: EmployeeWithGroups[];
  loading?: boolean;
  error?: string | null;
}

export function EmployeesTable({
  employees,
  loading = false,
  error = null,
}: EmployeesTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive' | 'terminated'
  >('all');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleStatusFilter = (
    status: 'all' | 'active' | 'inactive' | 'terminated'
  ) => {
    setStatusFilter(status);
    setSearchQuery('');
  };

  // Client-side filtering
  const filteredEmployees = useMemo(() => {
    let filtered = employees;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(employee => employee.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        employee =>
          employee.first_name?.toLowerCase().includes(query) ||
          employee.last_name?.toLowerCase().includes(query) ||
          employee.email?.toLowerCase().includes(query) ||
          employee.job_title?.toLowerCase().includes(query) ||
          employee.department?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [employees, statusFilter, searchQuery]);

  const formatGroups = (groups: unknown) => {
    if (!groups || !Array.isArray(groups)) return 'No groups';
    return (
      groups
        .map((group: { name?: string }) => group.name || 'Unknown')
        .join(', ') || 'No groups'
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Employees</CardTitle>
          <CardDescription>Loading employees...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center h-32'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Employees</CardTitle>
          <CardDescription>Error loading employees</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='text-red-600'>{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle>Employees</CardTitle>
            <CardDescription>
              Manage and view employee information
            </CardDescription>
          </div>
          <AddEmployeeDialog />
        </div>
        <div className='flex gap-4 mt-4'>
          <Input
            placeholder='Search employees...'
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            className='max-w-sm'
          />
          <div className='flex gap-2'>
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size='sm'
              onClick={() => handleStatusFilter('all')}
            >
              All
            </Button>
            <Button
              variant={statusFilter === 'active' ? 'default' : 'outline'}
              size='sm'
              onClick={() => handleStatusFilter('active')}
            >
              Active
            </Button>
            <Button
              variant={statusFilter === 'inactive' ? 'default' : 'outline'}
              size='sm'
              onClick={() => handleStatusFilter('inactive')}
            >
              Inactive
            </Button>
            <Button
              variant={statusFilter === 'terminated' ? 'default' : 'outline'}
              size='sm'
              onClick={() => handleStatusFilter('terminated')}
            >
              Terminated
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Groups</TableHead>
                <TableHead>Phone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className='text-center text-gray-500'>
                    No employees found
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map(employee => (
                  <TableRow key={employee.id}>
                    <TableCell className='font-medium'>
                      {employee.first_name} {employee.last_name}
                    </TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.job_title || 'N/A'}</TableCell>
                    <TableCell>{employee.department || 'N/A'}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          statusColors[employee.status || 'active']
                        }`}
                      >
                        {employee.status || 'active'}
                      </span>
                    </TableCell>
                    <TableCell className='max-w-xs truncate'>
                      {formatGroups(employee.groups)}
                    </TableCell>
                    <TableCell>{employee.phone || 'N/A'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
