import { NextRequest, NextResponse } from 'next/server';
import { simulatedCompanies, CompanyData } from '@/data/simulatedData';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const companyName = searchParams.get('name');

  if (!companyName) {
    return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
  }

  // Find the company (case-insensitive)
  const company = simulatedCompanies.find(
    c => c.name.toLowerCase() === companyName.toLowerCase()
  );

  if (!company) {
    return NextResponse.json({ error: 'Company not found in simulated data' }, { status: 404 });
  }

  // Calculate score with decay factor
  const today = new Date('2026-05-29'); // Mocking today's date for consistency with dataset
  let totalScore = 0;

  const eventsWithScores = company.events.map(event => {
    const eventDate = new Date(event.date);
    const diffTime = Math.abs(today.getTime() - eventDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Decay logic: lose 1 point every 3 days (just an arbitrary MVP decay algorithm)
    const decay = Math.floor(diffDays / 3);
    const finalScore = Math.max(0, event.impactScore - decay);
    
    totalScore += finalScore;

    return {
      ...event,
      calculatedScore: finalScore,
      decayApplied: decay
    };
  });

  return NextResponse.json({
    companyName: company.name,
    domain: company.domain,
    instabilityScore: totalScore,
    events: eventsWithScores
  });
}
