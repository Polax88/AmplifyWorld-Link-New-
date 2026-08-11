'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GenerateStep } from './GenerateStep';
import { ReadyStep } from './ReadyStep';
import type { GeneratedPage } from './types';

type Step = 'generate' | 'ready';

export default function OnboardingWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('generate');
  const [generated, setGenerated] = useState<GeneratedPage | null>(null);

  if (step === 'generate' || !generated) {
    return (
      <GenerateStep
        onComplete={(page) => {
          setGenerated(page);
          setStep('ready');
        }}
        onSkip={() => router.push('/dashboard?view=all')}
      />
    );
  }

  return <ReadyStep pageId={generated.pageId} handle={generated.handle} />;
}
