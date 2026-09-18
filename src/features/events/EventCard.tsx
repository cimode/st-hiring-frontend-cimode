import { Card, CardContent, Chip, Stack, Typography } from '@mui/material'
import { formatEventDate, formatPrice } from '../../utils/format'
import type { EventItem } from './types'

interface EventCardProps {
  event: EventItem
}

export const EventCard = ({ event }: EventCardProps) => {
  const ticketCount = event.availableTickets.length
  const lowestPrice = Math.min(...event.availableTickets.map((ticket) => ticket.price))

  return (
    <Card component="article" sx={{ height: '100%' }}>
      <CardContent>
        <Stack spacing={1}>
          <Typography variant="h6" component="h3">
            {event.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatEventDate(event.date)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {event.location || 'Location to be confirmed'}
          </Typography>
          {event.description && <Typography variant="body2">{event.description}</Typography>}
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {ticketCount > 0 ? (
              <>
                <Chip
                  size="small"
                  color="success"
                  label={`${ticketCount} ${ticketCount === 1 ? 'ticket' : 'tickets'} available`}
                />
                <Chip size="small" variant="outlined" label={`From ${formatPrice(lowestPrice)}`} />
              </>
            ) : (
              <Chip size="small" label="Sold out" />
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}
