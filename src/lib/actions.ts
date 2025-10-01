'use server';

import { createClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { Database } from '@/types/supabase';
import { generatePKCEPair } from './pkce';
import { env } from '../env.mjs';

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

type GenMsAuthUrlParams = {
  selectedType: string;
  integrationName: string;
};

export const genMsAuthUrl = async ({
  selectedType,
  integrationName,
}: GenMsAuthUrlParams) => {
  // Generate PKCE parameters
  const { codeVerifier, codeChallenge } = await generatePKCEPair();

  const scope = 'User.Read.All Directory.Read.All Group.Read.All';

  const authUrl = new URL(
    'https://login.microsoftonline.com/organizations/oauth2/v2.0/authorize'
  );
  authUrl.searchParams.set('client_id', env.NEXT_PUBLIC_MS_AZURE_CLIENT_ID);
  authUrl.searchParams.set(
    'redirect_uri',
    env.NEXT_PUBLIC_MS_AZURE_REDIRECT_URI
  );
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('response_mode', 'query');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set(
    'state',
    JSON.stringify({
      integrationType: selectedType,
      integrationName: integrationName.trim(),
      codeVerifier, // Store code verifier in state for callback
    })
  );

  return authUrl.toString();
};
