import { Rocket, X, ArrowRight, Loader2, CheckCircle, Target, Bot, Sparkles, Landmark, Swords, Globe } from 'lucide-react';

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
      color: aiConnected ? 'text-green-500' : 'text-amber-500'
    },
    {
      id: 'data-loaded',
      title: 'Institution Data',
      description: leadsLoaded ? 'Real data from NCUA & FDIC loaded' : 'Loading institutions...',
      complete: leadsLoaded,
      icon: leadsLoaded ? CheckCircle : Loader2,
      color: leadsLoaded ? 'text-green-500' : 'text-blue-500'
    },
    {
      id: 'select-lead',
      title: 'Select a Prospect',
      description: 'Click any institution to view AI insights',
      complete: false,
      icon: Target,
      color: 'text-purple-500'
    },
    {
      id: 'engage',
      title: 'Engage with AI',
      description: 'Get personalized emails, coaching & strategies',
      complete: false,
      icon: Bot,
      color: 'text-indigo-500'
    }
  ];

  const demoScenarios = [
    {
      id: 'enterprise',
      title: 'Enterprise Deal',
      description: '$10B+ credit union with complex needs',
      icon: Landmark,
      color: 'bg-blue-100 text-blue-700'
    },
    {
      id: 'competitive',
      title: 'Competitive Win',
      description: 'Jack Henry replacement opportunity',
      icon: Swords,
      color: 'bg-purple-100 text-purple-700'
    },
    {
      id: 'expansion',
      title: 'Market Expansion',
      description: 'Community bank in new territory',
      icon: Globe,
      color: 'bg-green-100 text-green-700'
    }
  ];

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 mb-6 text-white relative overflow-hidden">
      <button
        onClick={onDismiss}
        className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-lg transition-colors"
        title="Dismiss"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
          <Rocket className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Welcome to Rise Sales Agent</h2>
          <p className="text-blue-100 text-sm">AI-powered sales acceleration for Credit Unions & Banks</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Status Steps */}
        <div className="space-y-3">
          <h3 className="font-semibold text-blue-100 text-sm uppercase tracking-wider">System Status</h3>
          {steps.map((step) => (
            <div key={step.id} className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
              <step.icon className={`w-5 h-5 ${step.color} ${!step.complete && step.id !== 'select-lead' && step.id !== 'engage' ? 'animate-spin' : ''}`} />
              <div className="flex-1">
                <div className="font-medium text-sm">{step.title}</div>
                <div className="text-xs text-blue-200">{step.description}</div>
              </div>
              {step.complete && <CheckCircle className="w-5 h-5 text-green-400" />}
            </div>
          ))}
        </div>

        {/* Demo Scenarios */}
        <div className="space-y-3">
          <h3 className="font-semibold text-blue-100 text-sm uppercase tracking-wider">Quick Demo Scenarios</h3>
          {demoScenarios.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => onSelectDemo(scenario.id)}
              className="w-full flex items-center gap-3 bg-white/10 hover:bg-white/20 rounded-lg p-3 transition-colors text-left"
            >
              <div className={`w-10 h-10 ${scenario.color} rounded-lg flex items-center justify-center`}>
                <scenario.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">{scenario.title}</div>
                <div className="text-xs text-blue-200">{scenario.description}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-200" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
