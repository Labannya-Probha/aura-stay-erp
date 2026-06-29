import { useEffect, useState } from 'react'
import { Heart, Shield, TrendingUp, Users, Zap } from 'lucide-react'
import { Button } from './ui/button'

export function WelcomePopover({ isOpen, userName = 'Welcome', onClose }) {
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setAnimate(false)
      return undefined
    }
    const timer = window.setTimeout(() => setAnimate(true), 50)
    return () => window.clearTimeout(timer)
  }, [isOpen])

  if (!isOpen) return null

  const features = [
    { icon: <Zap className="h-5 w-5" />, title: 'Quick Actions', description: 'Fast access to all your tools', color: 'text-amber-500 bg-amber-500/10' },
    { icon: <TrendingUp className="h-5 w-5" />, title: 'Real-time Analytics', description: 'Track performance instantly', color: 'text-blue-500 bg-blue-500/10' },
    { icon: <Users className="h-5 w-5" />, title: 'Team Collaboration', description: 'Work together smoothly', color: 'text-green-500 bg-green-500/10' },
    { icon: <Shield className="h-5 w-5" />, title: 'Secure & Reliable', description: 'Your data stays protected', color: 'text-purple-500 bg-purple-500/10' },
  ]

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-ink/30 px-4 py-6 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Welcome"
        className={`w-full max-w-sm border-0 p-0 shadow-2xl transition-all duration-300 ${animate ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
      >
        <div className="rounded-xl border border-white/70 bg-gradient-to-br from-rose-50 via-white to-pink-50 p-6">
          <div className="mb-6 text-center">
            <div className="mb-3 flex justify-center">
              <div className="rounded-full bg-rose-500/20 p-3">
                <Heart className="h-6 w-6 fill-rose-500 text-rose-500" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Welcome, {userName}!</h2>
            <p className="mt-2 text-sm text-gray-500">Let's explore what you can do.</p>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-lg border border-white/40 bg-white/60 p-3 backdrop-blur transition-colors hover:border-white/70">
                <div className={`mb-2 w-fit rounded-lg p-2 ${feature.color}`}>
                  {feature.icon}
                </div>
                <h4 className="text-sm font-semibold text-gray-900">{feature.title}</h4>
                <p className="mt-1 text-xs text-gray-500">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="mb-6 rounded-lg border border-blue-200/30 bg-blue-50/50 p-3">
            <p className="text-xs font-medium text-blue-900">Pro Tip</p>
            <p className="mt-1 text-xs text-blue-700">Use the sidebar groups to jump between Front Office, Reports, and Operations.</p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="flex-1">
              Maybe Later
            </Button>
            <Button size="sm" onClick={onClose} className="flex-1 bg-rose-500 hover:bg-rose-600">
              Let's Go
            </Button>
          </div>

          <p className="mt-4 text-center text-xs text-gray-400">You'll see this once per session.</p>
        </div>
      </div>
    </div>
  )
}
