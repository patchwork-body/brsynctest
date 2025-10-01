'use client';

import { useState } from 'react';
import { Tables } from '@/types/supabase';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AddGroupDialog } from './add-group-dialog';

type Group = Tables<'groups'>;

interface GroupsTableProps {
  groups: Group[];
  onSearch?: (query: string) => void;
}

export function GroupsTable({ groups, onSearch }: GroupsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle>Groups</CardTitle>
            <CardDescription>Manage and view group information</CardDescription>
          </div>
          <AddGroupDialog />
        </div>
        <div className='mt-4'>
          <Input
            placeholder='Search groups...'
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            className='max-w-sm'
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>External ID</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className='text-center text-gray-500'>
                    No groups found
                  </TableCell>
                </TableRow>
              ) : (
                groups.map(group => (
                  <TableRow key={group.id}>
                    <TableCell className='font-medium'>{group.name}</TableCell>
                    <TableCell>{group.description || 'N/A'}</TableCell>
                    <TableCell>{group.external_id || 'N/A'}</TableCell>
                    <TableCell>
                      {group.created_at
                        ? new Date(group.created_at).toISOString().split('T')[0]
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {group.updated_at
                        ? new Date(group.updated_at).toISOString().split('T')[0]
                        : 'N/A'}
                    </TableCell>
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
