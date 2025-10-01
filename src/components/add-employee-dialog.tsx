'use client';

import { useState } from 'react';
import { addEmployee } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AddEmployeeDialog() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    try {
      await addEmployee(formData);
      setOpen(false);
    } catch (error) {
      console.error('Error adding employee:', error);
      // You could add toast notification here
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Employee</Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[800px] max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogDescription>
            Create a new employee record manually.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit}>
          <div className='grid gap-4 py-4'>
            {/* Name Fields */}
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='firstName'>First Name *</Label>
                <Input
                  id='firstName'
                  name='firstName'
                  required
                  placeholder='Enter first name'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='lastName'>Last Name *</Label>
                <Input
                  id='lastName'
                  name='lastName'
                  required
                  placeholder='Enter last name'
                />
              </div>
            </div>

            {/* Email and Employee ID */}
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='email'>Email *</Label>
                <Input
                  id='email'
                  name='email'
                  type='email'
                  required
                  placeholder='Enter email address'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='employeeId'>Employee ID</Label>
                <Input
                  id='employeeId'
                  name='employeeId'
                  placeholder='Employee ID (optional)'
                />
              </div>
            </div>

            {/* Job Title and Department */}
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='jobTitle'>Job Title</Label>
                <Input
                  id='jobTitle'
                  name='jobTitle'
                  placeholder='Job title (optional)'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='department'>Department</Label>
                <Input
                  id='department'
                  name='department'
                  placeholder='Department (optional)'
                />
              </div>
            </div>

            {/* Phone and Manager Email */}
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='phone'>Phone</Label>
                <Input
                  id='phone'
                  name='phone'
                  type='tel'
                  placeholder='Phone number (optional)'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='managerEmail'>Manager Email</Label>
                <Input
                  id='managerEmail'
                  name='managerEmail'
                  type='email'
                  placeholder='Manager email (optional)'
                />
              </div>
            </div>

            {/* External ID and Status */}
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='externalId'>External ID</Label>
                <Input
                  id='externalId'
                  name='externalId'
                  placeholder='External system ID (optional)'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='status'>Status</Label>
                <select
                  id='status'
                  name='status'
                  defaultValue='active'
                  className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                >
                  <option value='active'>Active</option>
                  <option value='inactive'>Inactive</option>
                  <option value='terminated'>Terminated</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Employee'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
