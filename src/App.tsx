import { useState } from 'react'
import { AppBar, Box, Container, Tab, Tabs, Toolbar, Typography } from '@mui/material'
import { EventsPage } from './features/events/EventsPage'
import { SettingsPage } from './features/settings/SettingsPage'

type View = 'events' | 'settings'

function App() {
  const [view, setView] = useState<View>('events')

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <AppBar position="static">
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ flexWrap: 'wrap', columnGap: 3 }}>
            <Typography variant="h6" component="h1" sx={{ py: 1 }}>
              See Tickets
            </Typography>
            <Tabs
              value={view}
              onChange={(_event, next: View) => setView(next)}
              aria-label="Main navigation"
              textColor="inherit"
              indicatorColor="secondary"
            >
              <Tab label="Events" value="events" id="tab-events" aria-controls="panel-events" />
              <Tab label="Settings" value="settings" id="tab-settings" aria-controls="panel-settings" />
            </Tabs>
          </Toolbar>
        </Container>
      </AppBar>

      <Container maxWidth="lg" component="main" sx={{ py: { xs: 3, sm: 4 } }}>
        <Box role="tabpanel" id={`panel-${view}`} aria-labelledby={`tab-${view}`}>
          {view === 'events' ? <EventsPage /> : <SettingsPage />}
        </Box>
      </Container>
    </Box>
  )
}

export default App
