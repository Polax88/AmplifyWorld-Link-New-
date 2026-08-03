'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StartStep } from './StartStep';
import { ReviewStep } from './ReviewStep';
import { SuccessStep } from './SuccessStep';
import type { WizardState } from './types';

type Step = 'start' | 'review' | 'success';

export default function OnboardingWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('start');
  const [state, setState] = useState<WizardState | null>(null);

  if (step === 'start' || !state) {
    return (
      <StartStep
        onComplete={(nextState) => {
          setState(nextState);
          setStep('review');
        }}
        onSkip={() => router.push('/dashboard?view=all')}
      />
    );
  }

  if (step === 'review') {
    return (
      <ReviewStep
        state={state}
        onUpdate={(updater) => setState((prev) => (prev ? updater(prev) : prev))}
        onCommitted={() => setStep('success')}
      />
    );
  }

  return <SuccessStep pageId={state.pageId} handle={state.handle} />;
}
