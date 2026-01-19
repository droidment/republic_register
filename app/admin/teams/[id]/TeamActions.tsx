'use client'

import { useState } from 'react'

interface Player {
  id: string
  name: string
  phone: string
  email: string
}

interface TeamPlayer {
  id: string
  waiver_signed: boolean
  lunch_choice: string | null
  players: Player
}

interface TeamActionsProps {
  teamId: string
  teamName: string
  inviteLink: string
  teamPlayers: TeamPlayer[]
}

export default function TeamActions({
  teamName,
  inviteLink,
  teamPlayers
}: TeamActionsProps) {
  const [sending, setSending] = useState(false)

  // Get players who need reminders (haven't completed waiver OR lunch)
  const playersNeedingReminder = teamPlayers.filter(
    tp => !tp.waiver_signed || !tp.lunch_choice
  )

  // Get all player phone numbers for bulk invite
  const allPlayerPhones = teamPlayers.map(tp => tp.players.phone)

  function sendInviteToPlayer(phone: string, playerName: string) {
    const message = encodeURIComponent(
      `Hi ${playerName}!\n\nYou're invited to join team "${teamName}" for the tournament!\n\nPlease click here to register, sign the waiver, and select your lunch preference:\n${inviteLink}`
    )
    // Format phone for WhatsApp (remove non-digits, add country code if needed)
    const formattedPhone = phone.replace(/\D/g, '')
    const phoneWithCountry = formattedPhone.startsWith('1') ? formattedPhone : `1${formattedPhone}`
    window.open(`https://wa.me/${phoneWithCountry}?text=${message}`, '_blank')
  }

  function sendReminderToPlayer(phone: string, playerName: string, needsWaiver: boolean, needsLunch: boolean) {
    let reminderText = ''
    if (needsWaiver && needsLunch) {
      reminderText = 'sign the waiver and select your lunch preference'
    } else if (needsWaiver) {
      reminderText = 'sign the waiver'
    } else if (needsLunch) {
      reminderText = 'select your lunch preference'
    }

    const message = encodeURIComponent(
      `Hi ${playerName}!\n\nFriendly reminder: Please complete your registration for team "${teamName}".\n\nYou still need to ${reminderText}.\n\nClick here to complete:\n${inviteLink}`
    )
    const formattedPhone = phone.replace(/\D/g, '')
    const phoneWithCountry = formattedPhone.startsWith('1') ? formattedPhone : `1${formattedPhone}`
    window.open(`https://wa.me/${phoneWithCountry}?text=${message}`, '_blank')
  }

  async function sendBulkInvites() {
    setSending(true)
    // Open WhatsApp for each player with a slight delay
    for (let i = 0; i < teamPlayers.length; i++) {
      const tp = teamPlayers[i]
      setTimeout(() => {
        sendInviteToPlayer(tp.players.phone, tp.players.name)
      }, i * 500) // 500ms delay between each
    }
    setTimeout(() => setSending(false), teamPlayers.length * 500 + 1000)
  }

  async function sendBulkReminders() {
    setSending(true)
    // Open WhatsApp for each player needing reminder
    for (let i = 0; i < playersNeedingReminder.length; i++) {
      const tp = playersNeedingReminder[i]
      setTimeout(() => {
        sendReminderToPlayer(
          tp.players.phone,
          tp.players.name,
          !tp.waiver_signed,
          !tp.lunch_choice
        )
      }, i * 500)
    }
    setTimeout(() => setSending(false), playersNeedingReminder.length * 500 + 1000)
  }

  if (teamPlayers.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>

      {/* Send Invites Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">Send Invites via WhatsApp</h3>
        <p className="text-xs text-gray-500">
          Send the registration link to players. Each player will open in a new WhatsApp window.
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={sendBulkInvites}
            disabled={sending || teamPlayers.length === 0}
            className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            {sending ? 'Opening...' : `Send to All (${teamPlayers.length})`}
          </button>
        </div>

        {/* Individual player invite buttons */}
        <div className="mt-3 space-y-2">
          <p className="text-xs text-gray-500">Or send individually:</p>
          <div className="flex flex-wrap gap-2">
            {teamPlayers.map((tp) => (
              <button
                key={tp.id}
                onClick={() => sendInviteToPlayer(tp.players.phone, tp.players.name)}
                className="inline-flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors"
              >
                {tp.players.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Send Reminders Section */}
      {playersNeedingReminder.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700">Send Reminders</h3>
          <p className="text-xs text-gray-500">
            {playersNeedingReminder.length} player{playersNeedingReminder.length !== 1 ? 's' : ''} still need{playersNeedingReminder.length === 1 ? 's' : ''} to complete registration.
          </p>

          <button
            onClick={sendBulkReminders}
            disabled={sending}
            className="inline-flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {sending ? 'Opening...' : `Send Reminders (${playersNeedingReminder.length})`}
          </button>

          {/* Individual reminder buttons */}
          <div className="mt-3 space-y-2">
            <p className="text-xs text-gray-500">Players needing reminders:</p>
            <div className="space-y-1">
              {playersNeedingReminder.map((tp) => (
                <div key={tp.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">{tp.players.name}</span>
                    <div className="flex gap-1 mt-0.5">
                      {!tp.waiver_signed && (
                        <span className="text-xs px-1.5 py-0.5 bg-yellow-200 text-yellow-800 rounded">
                          Waiver
                        </span>
                      )}
                      {!tp.lunch_choice && (
                        <span className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded">
                          Lunch
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => sendReminderToPlayer(
                      tp.players.phone,
                      tp.players.name,
                      !tp.waiver_signed,
                      !tp.lunch_choice
                    )}
                    className="ml-2 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-medium rounded transition-colors"
                  >
                    Remind
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {playersNeedingReminder.length === 0 && teamPlayers.length > 0 && (
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center text-green-600">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">All players have completed their registration!</span>
          </div>
        </div>
      )}
    </div>
  )
}
