'use server';

import { createClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { Database } from '@/types/supabase';

export async function addGroup(formData: FormData) {
  const supabase = await createClient<Database>();

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const externalId = formData.get('externalId') as string;

  if (!name) {
    throw new Error('Group name is required');
  }

  const { data, error } = await supabase
    .from('groups')
    .insert({
      name: name,
      description: description,
      external_id: externalId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create group: ${error.message}`);
  }

  revalidatePath('/');
  return data;
}

export async function addEmployee(formData: FormData) {
  const supabase = await createClient<Database>();

  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const email = formData.get('email') as string;
  const jobTitle = formData.get('jobTitle') as string;
  const department = formData.get('department') as string;
  const phone = formData.get('phone') as string;
  const managerEmail = formData.get('managerEmail') as string;
  const employeeId = formData.get('employeeId') as string;
  const externalId = formData.get('externalId') as string;
  const status = formData.get(
    'status'
  ) as Database['public']['Enums']['employee_status'];

  if (!firstName || !lastName || !email) {
    throw new Error('First name, last name, and email are required');
  }

  const { data, error } = await supabase
    .from('employees')
    .insert({
      first_name: firstName,
      last_name: lastName,
      email: email,
      job_title: jobTitle || null,
      department: department || null,
      phone: phone || null,
      manager_email: managerEmail || null,
      employee_id: employeeId || null,
      external_id: externalId || null,
      status: status || 'active',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create employee: ${error.message}`);
  }

  revalidatePath('/');
  return data;
}
