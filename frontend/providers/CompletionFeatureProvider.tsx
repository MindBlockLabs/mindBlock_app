import { CompletionProvider } from '../features/completion';

export default function CompletionFeatureProvider({ children }: { children: React.ReactNode }) {
  return <CompletionProvider>{children}</CompletionProvider>;
}
