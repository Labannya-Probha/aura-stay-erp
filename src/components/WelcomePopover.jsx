import { Popover, PopoverContent } from './ui/popover'
import { Button } from './ui/button'
import { Heart, Zap, Shield, TrendingUp, Users } from 'lucide-react'
import { useState, useEffect } from 'react'

export function WelcomePopover({ isOpen, userName = 'Welcome', onClose }) {
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setAnimate(true), 100)
    }
  }, [isOpen])

  const features = [
    {
      icon: <Zap className="w-5 h-5" />,
      title: 'Quick Actions',
      description: 'Fast access to all your tools',
      color: 'text-amber-500 bg-amber-500/10',
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: 'Real-time Analytics',
      description: 'Track performance instantly',
      color: 'text-blue-500 bg-blue-500/10',
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: 'Team Collaboration',
      description: 'Work together seamlessly',
      color: 'text-green-500 bg-green-500/10',
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: 'Secure & Reliable',
      description: 'Your data is protected',
      color: 'text-purple-500 bg-purple-500/10',
    },
  ]

  return (
    <Popover open={isOpen} onOpenChange={onClose}>
      <PopoverContent 
        side="right"
        align="center"
        className={`w-96 p-0 border-0 shadow-2xl transition-all duration-300 ${animate ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
      >
        <div className="bg-gradient-to-br from-rose-50 via-white to-pink-50 p-6 rounded-xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-rose-500/20 rounded-full">
                <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Welcome, {userName}! 👋</h2>
            <p className="text-sm text-gray-500 mt-2">Let's explore what you can do</p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {features.map((feature, idx) => (
              <div key={idx} className="p-3 bg-white/60 backdrop-blur rounded-lg border border-white/40 hover:border-white/60 transition-colors">
                <div className={`p-2 rounded-lg w-fit mb-2 ${feature.color}`}>
                  {feature.icon}
                </div>
                <h4 className="text-sm font-semibold text-gray-900">{feature.title}</h4>
                <p className="text-xs text-gray-500 mt-1">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="bg-blue-50/50 border border-blue-200/30 rounded-lg p-3 mb-6">
            <p className="text-xs text-blue-900 font-medium">💡 Pro Tip</p>
            <p className="text-xs text-blue-700 mt-1">Use keyboard shortcuts to navigate faster. Press '?' to see all shortcuts.</p>
          </div>

          {/* Action */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="flex-1"
            >
              Maybe Later
            </Button>
            <Button
              size="sm"
              onClick={onClose}
              className="flex-1 bg-rose-500 hover:bg-rose-600"
            >
              Let's Go! 🚀
            </Button>
          </div>

          {/* Footer */}
          <p className="text-xs text-gray-400 text-center mt-4">
            You'll see this once per session. Need help? Check our docs.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}
