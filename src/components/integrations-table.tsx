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
import { Button } from '@/components/ui/button';
import { AddIntegrationDialog } from './add-integration-dialog';

const statusColors = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  error: 'bg-red-100 text-red-800',
  pending_auth: 'bg-yellow-100 text-yellow-800',
};

const typeIcons = {
  microsoft_entra: '🔷',
  google_workspace: '🔶',
  csv: '📄',
};

type Integration = Tables<'integrations'>;

interface IntegrationsTableProps {
  integrations: Integration[];
}

export function IntegrationsTable({ integrations }: IntegrationsTableProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const formatLastSync = (lastSyncAt: string | null) => {
    if (!lastSyncAt) return 'Never';
    const date = new Date(lastSyncAt);
    return date.toISOString().replace('T', ' ').split('.')[0];
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Integrations</CardTitle>
              <CardDescription>
                Connect external systems to sync employee and group data
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              Add Integration
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {integrations.length === 0 ? (
            <div className='text-center text-gray-500 py-8'>
              No integrations found. Add one to get started.
            </div>
          ) : (
            <div className='space-y-4'>
              {integrations.map(integration => (
                <Card key={integration.id} className='p-4'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <span className='text-2xl'>
                        {typeIcons[integration.type]}
                      </span>
                      <div>
                        <h3 className='font-semibold text-lg'>
                          {integration.name}
                        </h3>
                        <p className='text-sm text-gray-600 capitalize'>
                          {integration.type.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center gap-3'>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          statusColors[integration.status]
                        }`}
                      >
                        {integration.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className='mt-3 flex gap-6 text-sm text-gray-600'>
                    <div>
                      <span className='font-medium'>Last Sync:</span>{' '}
                      {formatLastSync(integration.last_sync_at)}
                    </div>
                    <div>
                      <span className='font-medium'>Created:</span>{' '}
                      {integration.created_at
                        ? new Date(integration.created_at)
                            .toISOString()
                            .split('T')[0]
                        : 'N/A'}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddIntegrationDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
    </>
  );
}
