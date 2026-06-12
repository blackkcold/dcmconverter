import { AppProviders } from './providers/AppProviders';
import { AppShell } from './AppShell';

export function App() {
  return (
    <AppProviders>
      <AppShell />
    </AppProviders>
  );
}
