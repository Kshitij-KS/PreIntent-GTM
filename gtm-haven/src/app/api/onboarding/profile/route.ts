import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { runLiveSweep } from '@/actions/sweep-actions';
import { updateOrgStatus } from '@/actions/org-actions';
import { resolveCompetitors } from '@/actions/competitor-actions';

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
          companyName: account.name,
          websiteUrl: account.website, // Uses resolved website from onboarding
          includeCompetitors: true,    // Leverages resolved competitor data
        });

        if (result.success && result.data) {
          sweepResults.push({
            account: account.name,
            ...result.data,
          });

          // Persist Account Profile
          if (result.data.profile) {
            await supabase.from('account_profiles').insert({
              org_id: orgId,
              account_name: account.name,
              website: account.website,
              convergence_score: result.data.profile.convergenceScore,
              urgency_level: result.data.profile.urgencyLevel,
              last_scanned: new Date().toISOString(),
              raw_data: result.data.profile,
            });
          }

          // Persist Signals
          if (result.data.signals && result.data.signals.length > 0) {
            const signalsToInsert = result.data.signals.map((signal: any) => ({
              org_id: orgId,
              account_name: account.name,
              signal_type: signal.type,
              confidence: signal.confidence,
              description: signal.description,
              source_url: signal.sourceUrl,
              detected_at: new Date().toISOString(),
            }));
            await supabase.from('engine_signals').insert(signalsToInsert);
          }

          // Persist Convergence Run
          if (result.data.convergence) {
            await supabase.from('convergence_runs').insert({
              org_id: orgId,
              account_name: account.name,
              overall_score: result.data.convergence.overallScore,
              pain_score: result.data.convergence.painScore,
              void_score: result.data.convergence.voidScore,
              compliance_score: result.data.convergence.complianceScore,
              run_date: new Date().toISOString(),
            });
          }

          // Persist Intel Brief
          if (result.data.brief) {
            await supabase.from('intel_briefs').insert({
              org_id: orgId,
              account_name: account.name,
              title: `Initial Intelligence Brief - ${account.name}`,
              content: result.data.brief,
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
    await updateOrgStatus(orgId, 'resolved');

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