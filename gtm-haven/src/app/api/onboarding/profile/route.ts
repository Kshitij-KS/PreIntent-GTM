import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { runLiveSweep } from '@/app/actions';

async function updateOrgStatus(orgId: string, status: string, supabase: any) {
  return await supabase
    .from('organizations')
    .update({ status })
    .eq('id', orgId);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orgId, seedAccounts } = body;

    if (!orgId || !seedAccounts || !Array.isArray(seedAccounts)) {
      return NextResponse.json(
        { error: 'Missing orgId or seedAccounts' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log(`[InitialSweep] Starting comprehensive sweep for org ${orgId} with ${seedAccounts.length} accounts`);

    const sweepResults = [];
    const errors = [];

    // Run live sweeps for ALL seed accounts sequentially to avoid rate limits
    for (const account of seedAccounts) {
      try {
        console.log(`[InitialSweep] Sweeping account: ${account.name}`);
        
        // Execute the full live sweep pipeline (BrightData -> AI -> Featherless -> Speechmatics)
        const result = await runLiveSweep({
          account: account.name,
          industry: 'Unknown',
          employees: 'Unknown',
          competitor: 'Unknown',
        });

        if (result.success) {
          sweepResults.push({
            account: account.name,
            ...result,
          });

          // Persist Account Profile
          if (result.profile) {
            await supabase.from('account_profiles').insert({
              org_id: orgId,
              account_name: account.name,
              website: account.website,
              convergence_score: result.profile.convergenceScore,
              urgency_level: result.profile.urgency,
              last_scanned: new Date().toISOString(),
              raw_data: result.profile,
            });
          }

          // Persist Signals
          if (result.signals && result.signals.length > 0) {
            const signalsToInsert = result.signals.map((signal: any) => ({
              org_id: orgId,
              account_name: account.name,
              signal_type: signal.engine,
              confidence: signal.confidence,
              description: signal.description,
              source_url: signal.provenance?.url || '',
              detected_at: new Date().toISOString(),
            }));
            await supabase.from('engine_signals').insert(signalsToInsert);
          }

          // Persist Convergence Run
          if (result.profile) {
            await supabase.from('convergence_runs').insert({
              org_id: orgId,
              account_name: account.name,
              overall_score: result.profile.convergenceScore,
              pain_score: result.profile.pain.subScore,
              void_score: result.profile.void.subScore,
              compliance_score: result.profile.compliance.subScore,
              run_date: new Date().toISOString(),
            });
          }

          // Persist Intel Brief
          if (result.brief) {
            await supabase.from('intel_briefs').insert({
              org_id: orgId,
              account_name: account.name,
              title: `Initial Intelligence Brief - ${account.name}`,
              content: result.brief,
              generated_at: new Date().toISOString(),
            });
          }
        } else {
          errors.push({ account: account.name, error: result.error || 'Sweep failed' });
        }
      } catch (err: any) {
        console.error(`[InitialSweep] Error sweeping ${account.name}:`, err);
        errors.push({ account: account.name, error: err.message });
      }
    }

    // Update organization status to 'resolved' indicating initial data population is done
    await updateOrgStatus(orgId, 'resolved', supabase);

    return NextResponse.json({
      success: true,
      message: `Initial sweep completed for ${seedAccounts.length} accounts`,
      results: sweepResults,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    console.error('[InitialSweep] Critical error:', error);
    return NextResponse.json(
      { error: 'Failed to run initial sweep', details: error.message },
      { status: 500 }
    );
  }
}