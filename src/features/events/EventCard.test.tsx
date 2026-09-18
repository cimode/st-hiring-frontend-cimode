import { render, screen } from '@testing-library/react'
import { EventCard } from './EventCard'
import { buildEvent } from './testData'

describe('EventCard', () => {
  it('shows the event name, date, location and description', () => {
    render(<EventCard event={buildEvent()} />)

    expect(screen.getByRole('heading', { name: 'Rock Night' })).toBeInTheDocument()
    expect(screen.getByText(/jul 1, 2024/i)).toBeInTheDocument()
    expect(screen.getByText('Madrid Arena')).toBeInTheDocument()
    expect(screen.getByText('A night of rock classics.')).toBeInTheDocument()
  })

  it('summarises available tickets with the lowest price', () => {
    render(<EventCard event={buildEvent()} />)

    expect(screen.getByText('2 tickets available')).toBeInTheDocument()
    expect(screen.getByText('From $25.00')).toBeInTheDocument()
  })

  it('uses the singular for a single ticket', () => {
    const [ticket] = buildEvent().availableTickets
    render(<EventCard event={buildEvent({ availableTickets: [ticket] })} />)

    expect(screen.getByText('1 ticket available')).toBeInTheDocument()
  })

  it('marks events without tickets as sold out', () => {
    render(<EventCard event={buildEvent({ availableTickets: [] })} />)

    expect(screen.getByText('Sold out')).toBeInTheDocument()
    expect(screen.queryByText(/^from/i)).not.toBeInTheDocument()
  })

  it('falls back when the location is missing', () => {
    render(<EventCard event={buildEvent({ location: null })} />)

    expect(screen.getByText('Location to be confirmed')).toBeInTheDocument()
  })
})
