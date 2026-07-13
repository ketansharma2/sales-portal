import { supabaseServer } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth-helper'

export async function GET(request) {
    try {
        // Authentication - user injected by middleware (no auth calls needed!)
        const { user, error: authError } = getUser(request);
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get('client_id');

        if (!clientId) {
            return Response.json({
                success: false,
                message: 'client_id is required'
            }, { status: 400 });
        }

        // Fetch client details from corporate_leadgen_leads
        // Try client_id first, then fall back to id
        const { data: clientData, error: clientError } = await supabaseServer
            .from('corporate_leadgen_leads')
            .select('*')
            .eq('client_id', clientId)
            .maybeSingle();

        // If not found by client_id, try by id
        let finalClientData = clientData;
        if (!finalClientData) {
            const { data: clientById, error: clientByIdError } = await supabaseServer
                .from('corporate_leadgen_leads')
                .select('*')
                .eq('id', clientId)
                .maybeSingle();
            
            finalClientData = clientById;
        }

        if (clientError && !finalClientData) {
            console.error('Error fetching client:', clientError);
            return Response.json({
                success: false,
                message: 'Failed to fetch client details',
                error: clientError.message
            }, { status: 500 });
        }

        // If no client found, return empty data
        if (!finalClientData) {
            return Response.json({
                success: true,
                data: {
                    client: null,
                    interactions: []
                }
            });
        }

        // Fetch interactions from corporate_leads_interaction
        // Use client_id from the found client or the passed id
        const searchClientId = finalClientData?.client_id || clientId;
        
        const { data: interactionData, error: interactionError } = await supabaseServer
            .from('corporate_leads_interaction')
            .select('*')
            .eq('client_id', searchClientId)
            .order('date', { ascending: false });

        if (interactionError) {
            console.error('Error fetching interactions:', interactionError);
            return Response.json({
                success: false,
                message: 'Failed to fetch interactions',
                error: interactionError.message
            }, { status: 500 });
        }

        return Response.json({
            success: true,
            data: {
                client: finalClientData,
                interactions: interactionData || []
            }
        });

    } catch (error) {
        console.error('Unexpected error:', error);
        return Response.json({
            success: false,
            message: 'Internal server error',
            error: error.message
        }, { status: 500 });
    }
}
