import { Rocket, X, ArrowRight, Loader2, CheckCircle, Target, Bot, Sparkles, Landmark, Swords, Globe } from 'lucide-react';
import { cn } from '../lib/utils';

interface GettingStartedProps {
  aiConnected: boolean | null;
  leadsLoaded: boolean;
  onDismiss: () => void;
  onSelectDemo: (scenario: string) => void;
}

export default function GettingStarted({
  aiConnected,
  leadsLoaded,
  onDismiss,
  onSelectDemo
}: GettingStartedProps) {
  const steps = [
    {
      id: 'ai-status',
      title: 'AI Backend',
      description: aiConnected ? 'Claude AI is connected and ready' : 'AI backend starting up...',
      complete: aiConnected === true,
      icon: aiConnected ? Sparkles : Loader2,
      color: aiConnected ? 'text-green-400' : 'text-amber-400'
    },
    {
      id: 'data-loaded',
      title: 'Institution Data',
      description: leadsLoaded ? 'Credit union & bank data loaded from NCUA & FDIC' : 'Loading credit unions...',
      complete: leadsLoaded,
      icon: leadsLoaded ? CheckCircle : Loader2,
      color: leadsLoaded ? 'text-green-400' : 'text-blue-300'
    },
    {
      id: 'select-lead',
      title: 'Select a Prospect',
      description: 'Click any credit union to view AI insights',
      complete: false,
      icon: Target,
      color: 'text-purple-300'
    },
    {
      id: 'engage',
      title: 'Engage with AI',
      description: 'Get personalized emails, coaching & strategies',
      complete: false,
      icon: Bot,
      color: 'text-indigo-300'
    }
  ];

  const demoScenarios = [
    {
      id: 'enterprise',
      title: 'Enterprise Deal',
      description: '$10B+ credit union with complex needs',
      icon: Landmark,
      color: 'bg-blue-500/20 text-blue-200'
    },
    {
      id: 'competitive',
      title: 'Competitive Win',
      description: 'Jack Henry replacement opportunity',
      icon: Swords,
      color: 'bg-purple-500/20 text-purple-200'
    },
    {
      id: 'expansion',
      title: 'Growth CU',
      description: 'Fast-growing credit union ready for analytics',
      icon: Globe,
      color: 'bg-emerald-500/20 text-emerald-200'
    }
  ];

  return (
    <div className="relative rounded-xl p-6 mb-6 text-white overflow-hidden">
      {/* Gradient background with noise texture feel */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.1)_0%,transparent_50%)]" />

      <div className="relative z-10">
        <button
          onClick={onDismiss}
          className="absolute top-0 right-0 p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          title="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center ring-1 ring-white/20 shadow-lg">
            <Rocket className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Welcome to Rise Sales Agent</h2>
            <p className="text-blue-200 text-sm">AI-powered sales intelligence for Credit Unions</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Status Steps */}
          <div className="space-y-2.5">
            <h3 className="font-semibold text-blue-200 text-[11px] uppercase tracking-widest mb-3">System Status</h3>
            {steps.map((step) => (
              <div key={step.id} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3 ring-1 ring-white/5">
                <step.icon className={cn(
                  'w-5 h-5 flex-shrink-0',
                  step.color,
                  !step.complete && step.id !== 'select-lead' && step.id !== 'engage' && 'animate-spin'
                )} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{step.title}</div>
                  <div className="text-xs text-blue-200/80 truncate">{step.description}</div>
                </div>
                {step.complete && <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />}
              </div>
            ))}
          </div>

          {/* Demo Scenarios */}
          <div className="space-y-2.5">
            <h3 className="font-semibold text-blue-200 text-[11px] uppercase tracking-widest mb-3">Quick Demo Scenarios</h3>
            {demoScenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => onSelectDemo(scenario.id)}
                className="w-full flex items-center gap-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl p-3 transition-all text-left ring-1 ring-white/5 hover:ring-white/15 group"
              >
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', scenario.color)}>
                  <scenario.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{scenario.title}</div>
                  <div className="text-xs text-blue-200/80">{scenario.description}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-200 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
