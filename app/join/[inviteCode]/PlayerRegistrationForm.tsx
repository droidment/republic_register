'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import SignaturePad from '@/components/SignaturePad'

interface WaiverContent {
  id: string
  title: string
  content: string
}

interface PlayerRegistrationFormProps {
  teamId: string
  teamName: string
  leagueSlug: string
  waiver: WaiverContent | null
}

type Step = 'info' | 'waiver' | 'lunch' | 'complete'

export default function PlayerRegistrationForm({
  teamId,
  teamName,
  leagueSlug,
  waiver,
}: PlayerRegistrationFormProps) {
  const [step, setStep] = useState<Step>('info')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Player info
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [teamPlayerId, setTeamPlayerId] = useState<string | null>(null)

  // Waiver
  const [waiverAccepted, setWaiverAccepted] = useState(false)
  const [signature, setSignature] = useState<string | null>(null)

  // Lunch
  const [lunchChoice, setLunchChoice] = useState<'veg' | 'non-veg' | 'none' | null>(null)

  async function handleInfoSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const normalizedPhone = phone.replace(/\D/g, '')

    // Check league restrictions
    const { data: existingPlayer } = await supabase
      .from('players')
      .select('id')
      .eq('phone', normalizedPhone)
      .single()

    if (existingPlayer) {
      // Check if already in this team
      const { data: existingRegistration } = await supabase
        .from('team_players')
        .select('id, waiver_signed, lunch_choice')
        .eq('player_id', existingPlayer.id)
        .eq('team_id', teamId)
        .single()

      if (existingRegistration) {
        // Player already registered, skip to appropriate step
        setPlayerId(existingPlayer.id)
        setTeamPlayerId(existingRegistration.id)

        if (!existingRegistration.waiver_signed) {
          setStep('waiver')
        } else if (!existingRegistration.lunch_choice) {
          setStep('lunch')
        } else {
          setStep('complete')
        }
        setLoading(false)
        return
      }

      // Check throwball isolation rule
      const { data: playerTeams } = await supabase
        .from('team_players')
        .select('teams(leagues(slug))')
        .eq('player_id', existingPlayer.id)

      if (playerTeams && playerTeams.length > 0) {
        const isJoiningThrowball = leagueSlug === 'throwball'
        const isInThrowball = playerTeams.some(
          (pt) => (pt.teams as { leagues: { slug: string } })?.leagues?.slug === 'throwball'
        )
        const isInVolleyball = playerTeams.some(
          (pt) => (pt.teams as { leagues: { slug: string } })?.leagues?.slug !== 'throwball'
        )

        if (isJoiningThrowball && isInVolleyball) {
          setError('You are already registered in a Volleyball league and cannot join Throwball. Throwball is for women players not participating in Volleyball.')
          setLoading(false)
          return
        }

        if (!isJoiningThrowball && isInThrowball) {
          setError('You are already registered in Throwball and cannot join a Volleyball league.')
          setLoading(false)
          return
        }
      }

      // Add existing player to this team
      const { data: newTeamPlayer, error: joinError } = await supabase
        .from('team_players')
        .insert({
          team_id: teamId,
          player_id: existingPlayer.id,
          added_by: 'self',
        })
        .select('id')
        .single()

      if (joinError) {
        setError(joinError.message)
        setLoading(false)
        return
      }

      setPlayerId(existingPlayer.id)
      setTeamPlayerId(newTeamPlayer.id)
      setStep('waiver')
      setLoading(false)
      return
    }

    // Create new player
    const { data: newPlayer, error: createError } = await supabase
      .from('players')
      .insert({
        name,
        email,
        phone: normalizedPhone,
      })
      .select('id')
      .single()

    if (createError) {
      setError(createError.message)
      setLoading(false)
      return
    }

    // Add player to team
    const { data: newTeamPlayer, error: joinError } = await supabase
      .from('team_players')
      .insert({
        team_id: teamId,
        player_id: newPlayer.id,
        added_by: 'self',
      })
      .select('id')
      .single()

    if (joinError) {
      setError(joinError.message)
      setLoading(false)
      return
    }

    setPlayerId(newPlayer.id)
    setTeamPlayerId(newTeamPlayer.id)
    setStep('waiver')
    setLoading(false)
  }

  async function handleWaiverSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!waiverAccepted || !signature) {
      setError('Please accept the waiver and provide your signature.')
      return
    }

    setLoading(true)
    setError(null)

    const supabase = createClient()

    // In a production app, you would upload the signature to Supabase Storage
    // For now, we'll store a placeholder URL
    const signatureUrl = 'signed' // In production: upload and get URL

    const { error: updateError } = await supabase
      .from('team_players')
      .update({
        waiver_signed: true,
        waiver_signed_at: new Date().toISOString(),
        signature_url: signatureUrl,
      })
      .eq('id', teamPlayerId)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setStep('lunch')
    setLoading(false)
  }

  async function handleLunchSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!lunchChoice) {
      setError('Please select your lunch preference.')
      return
    }

    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { error: updateError } = await supabase
      .from('team_players')
      .update({
        lunch_choice: lunchChoice,
        lunch_selected_at: new Date().toISOString(),
      })
      .eq('id', teamPlayerId)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setStep('complete')
    setLoading(false)
  }

  // Step indicators
  const steps = [
    { key: 'info', label: 'Your Info' },
    { key: 'waiver', label: 'Waiver' },
    { key: 'lunch', label: 'Lunch' },
  ]

  const currentStepIndex = steps.findIndex((s) => s.key === step)

  return (
    <div>
      {/* Progress indicator */}
      {step !== 'complete' && (
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {steps.map((s, index) => (
              <div key={s.key} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index < currentStepIndex
                      ? 'bg-green-500 text-white'
                      : index === currentStepIndex
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {index < currentStepIndex ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`ml-2 text-sm ${
                    index === currentStepIndex ? 'text-blue-600 font-medium' : 'text-gray-500'
                  }`}
                >
                  {s.label}
                </span>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 h-0.5 mx-4 ${
                      index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Step 1: Player Info */}
      {step === 'info' && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Information</h2>
          <form onSubmit={handleInfoSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name *
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 bg-white"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address *
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 bg-white"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number *
              </label>
              <input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 bg-white"
                placeholder="234-567-8900"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Continue'}
            </button>
          </form>
        </div>
      )}

      {/* Step 2: Waiver */}
      {step === 'waiver' && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {waiver?.title || 'Tournament Waiver'}
          </h2>

          <form onSubmit={handleWaiverSubmit} className="space-y-6">
            {/* Waiver Content */}
            <div className="bg-gray-50 rounded-lg p-6 max-h-80 overflow-y-auto border border-gray-200">
              <div className="prose prose-sm max-w-none">
                {waiver?.content.split('\n').map((line, i) => {
                  if (line.startsWith('## ')) {
                    return (
                      <h2 key={i} className="text-lg font-semibold mt-4 mb-2">
                        {line.replace('## ', '')}
                      </h2>
                    )
                  }
                  if (line.startsWith('### ')) {
                    return (
                      <h3 key={i} className="text-md font-semibold mt-3 mb-1">
                        {line.replace('### ', '')}
                      </h3>
                    )
                  }
                  if (line.startsWith('- ')) {
                    return (
                      <li key={i} className="ml-4">
                        {line.replace('- ', '')}
                      </li>
                    )
                  }
                  if (line.trim() === '') {
                    return <br key={i} />
                  }
                  return (
                    <p key={i} className="mb-2">
                      {line}
                    </p>
                  )
                })}
              </div>
            </div>

            {/* Acceptance Checkbox */}
            <div className="flex items-start">
              <input
                id="accept"
                type="checkbox"
                checked={waiverAccepted}
                onChange={(e) => setWaiverAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="accept" className="ml-3 text-sm text-gray-700">
                I have read and agree to the terms of this waiver. I understand that by checking this
                box, I am legally bound by its terms.
              </label>
            </div>

            {/* Signature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Signature *
              </label>
              <SignaturePad onSave={setSignature} disabled={!waiverAccepted} />
            </div>

            <button
              type="submit"
              disabled={loading || !waiverAccepted || !signature}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Sign and Continue'}
            </button>
          </form>
        </div>
      )}

      {/* Step 3: Lunch Selection */}
      {step === 'lunch' && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Lunch Preference</h2>
          <p className="text-gray-600 mb-6">
            Please select your lunch preference for the tournament day.
          </p>

          <form onSubmit={handleLunchSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setLunchChoice('veg')}
                className={`p-6 rounded-xl border-2 text-left transition-all ${
                  lunchChoice === 'veg'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                }`}
              >
                <div className="text-3xl mb-2">🥗</div>
                <p className="font-semibold text-gray-900">Vegetarian</p>
                <ul className="text-sm text-gray-600 mt-2 space-y-1">
                  <li>• Veg Biryani</li>
                  <li>• Veg Appetizer</li>
                  <li>• Veg Curry</li>
                  <li>• Gulab Jamun</li>
                </ul>
              </button>

              <button
                type="button"
                onClick={() => setLunchChoice('non-veg')}
                className={`p-6 rounded-xl border-2 text-left transition-all ${
                  lunchChoice === 'non-veg'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                }`}
              >
                <div className="text-3xl mb-2">🍗</div>
                <p className="font-semibold text-gray-900">Non-Vegetarian</p>
                <ul className="text-sm text-gray-600 mt-2 space-y-1">
                  <li>• Chicken Biryani</li>
                  <li>• Non-Veg Appetizer</li>
                  <li>• Non-Veg Curry</li>
                  <li>• Gulab Jamun</li>
                </ul>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setLunchChoice('none')}
              className={`w-full p-4 rounded-xl border-2 text-center transition-all ${
                lunchChoice === 'none'
                  ? 'border-gray-500 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <p className="font-semibold text-gray-900">No Lunch Needed</p>
              <p className="text-sm text-gray-500 mt-1">I will not need lunch</p>
            </button>

            <button
              type="submit"
              disabled={loading || !lunchChoice}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Complete Registration'}
            </button>
          </form>
        </div>
      )}

      {/* Complete */}
      {step === 'complete' && (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">You're All Set!</h2>
          <p className="mt-2 text-gray-600">
            You've been registered for <strong>{teamName}</strong>.
          </p>
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">What's next?</p>
            <ul className="mt-2 text-sm text-gray-700 space-y-1">
              <li>• Your waiver has been signed</li>
              <li>
                • Your lunch choice:{' '}
                <strong>{lunchChoice === 'veg' ? 'Vegetarian' : lunchChoice === 'non-veg' ? 'Non-Vegetarian' : 'No lunch needed'}</strong>
              </li>
              <li>• Your team captain has been notified</li>
            </ul>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            See you at the tournament! 🏐
          </p>
        </div>
      )}
    </div>
  )
}
