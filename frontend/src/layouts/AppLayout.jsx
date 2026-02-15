import Header from '../components/Header.jsx';

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
