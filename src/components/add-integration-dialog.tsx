'use client';

import { useState } from 'react';
import { Tables } from '@/types/supabase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { genGoogleAuthUrl, genMsAuthUrl } from '../lib/actions';

type IntegrationType = Tables<'integrations'>['type'];

interface AddIntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const integrationTypes: {
  type: IntegrationType;
  name: string;
  description: string;
  icon: string;
  requiresOAuth: boolean;
}[] = [
  {
    type: 'microsoft_entra',
    name: 'Microsoft Entra ID',
    description: 'Sync employees and groups from Microsoft Entra ID (Azure AD)',
    icon: '🔷',
    requiresOAuth: true,
  },
  {
    type: 'google_workspace',
    name: 'Google Workspace',
    description: 'Sync employees and groups from Google Workspace',
    icon: '🔶',
    requiresOAuth: true,
  },
  {
    type: 'csv',
    name: 'CSV Upload',
    description: 'Upload employee data via CSV file',
    icon: '📄',
    requiresOAuth: false,
  },
];

export function AddIntegrationDialog({
  open,
  onOpenChange,
}: AddIntegrationDialogProps) {
  const [selectedType, setSelectedType] = useState<IntegrationType | null>(
    null
  );
  const [integrationName, setIntegrationName] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTypeSelect = (type: IntegrationType) => {
    setSelectedType(type);
    setError(null);
  };

  const handleConnect = async () => {
    if (!selectedType || !integrationName.trim()) {
      setError('Please provide an integration name');
      return;
    }

    if (selectedType === 'microsoft_entra') {
      setIsConnecting(true);

      try {
        window.location.href = await genMsAuthUrl({
          integrationName,
          selectedType,
        });
      } catch (error) {
        console.error('Failed to generate PKCE parameters:', error);
        setError('Failed to initialize OAuth flow');
      } finally {
        setIsConnecting(false);
      }
    } else if (selectedType === 'google_workspace') {
      setIsConnecting(true);

      try {
        window.location.href = await genGoogleAuthUrl({
          integrationName,
          selectedType,
        });
      } catch (error) {
        console.error('Failed to generate PKCE parameters:', error);
        setError('Failed to initialize OAuth flow');
      } finally {
        setIsConnecting(false);
      }
    } else {
      // Handle other integration types
      setError('Integration type not yet implemented');
    }
  };

  const handleClose = () => {
    setSelectedType(null);
    setIntegrationName('');
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Add Integration</DialogTitle>
          <DialogDescription>
            Choose an integration type to connect your external system
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {!selectedType ? (
            <div className='space-y-3'>
              {integrationTypes.map(integration => (
                <div
                  key={integration.type}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedType === integration.type
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleTypeSelect(integration.type)}
                >
                  <div className='flex items-start gap-3'>
                    <span className='text-2xl'>{integration.icon}</span>
                    <div className='flex-1'>
                      <h3 className='font-medium'>{integration.name}</h3>
                      <p className='text-sm text-gray-600'>
                        {integration.description}
                      </p>
                      {integration.requiresOAuth && (
                        <span className='inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded'>
                          OAuth Required
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='space-y-4'>
              <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg'>
                <span className='text-2xl'>
                  {integrationTypes.find(t => t.type === selectedType)?.icon}
                </span>
                <div>
                  <h3 className='font-medium'>
                    {integrationTypes.find(t => t.type === selectedType)?.name}
                  </h3>
                  <p className='text-sm text-gray-600'>
                    {
                      integrationTypes.find(t => t.type === selectedType)
                        ?.description
                    }
                  </p>
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='integration-name'>Integration Name</Label>
                <Input
                  id='integration-name'
                  placeholder='Enter a name for this integration'
                  value={integrationName}
                  onChange={e => setIntegrationName(e.target.value)}
                />
              </div>

              {error && (
                <div className='p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded'>
                  {error}
                </div>
              )}

              <div className='flex gap-2 pt-4'>
                <Button
                  variant='outline'
                  onClick={() => setSelectedType(null)}
                  className='flex-1'
                >
                  Back
                </Button>
                <Button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className='flex-1'
                >
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
